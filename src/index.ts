import { defaultConfig as cfg } from "./config.ts";
import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";
import { brokenithm } from "./brokenithm.ts"

async function main() {
    const app = express();

    // Serve ./www
    app.use(express.static(path.resolve(__dirname, "www")));

    const server = http.createServer(app);

    // WebSocket on same port
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (ws) => {
        const brokenClient = new brokenithm();

        console.log("ws connected");
        ws.on("message", (data, isBinary) => {
            if (isBinary) return;

            const msg = data.toString();
            // echo for now
            // ws.send(msg);
            if (msg === "alive?") {
                ws.send("alive");
                return;
            }

            if (msg.startsWith("b")) {
                const payload = msg.slice(1); // "0010..."
                if (payload.length < 38) return;
                const slider: boolean[] = new Array(32).fill(false);
                const air: boolean[] = new Array(6).fill(false);

                for (let i = 0; i < 32; i++) {
                    slider[i] = payload[i] === "1";
                }
                for (let i = 0; i < 6; i++) {
                    air[i] = payload[32 + i] === "1";
                }

                // no service/test buttons from browser, set false
                brokenClient.sendKeys(slider, air, false, false);
            }
        });


        brokenClient.emitter.on("led", rawColors => {
            //console.log(rawColors.length / 3)
            const colors = []

            for (let i = 0; i < 32; i++) {
                let index = i * 3
                let blue = (rawColors[index] || 0) & 0xff
                let red = (rawColors[index + 1] || 0) & 0xff
                let green = (rawColors[index + 2] || 0) & 0xff
                //let color = 0xff000000 or(red.toLong() shl 16) or(green.toLong() shl 8) or blue.toLong()
                index = (31 - i) * 3
                colors[index] = red
                colors[index + 1] = green
                colors[index + 2] = blue
            }

            const buf = Buffer.from(new Uint8Array(colors))

            //console.log(colors, rawColors)

            ws.send(buf)
        })


        ws.on("close", () => {
            console.log("ws disconnected");

            brokenClient.destroy();
        })
    });

    server.listen(cfg.webPort, () => {
        console.log(`listening on ${cfg.webPort}`);
    });
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});