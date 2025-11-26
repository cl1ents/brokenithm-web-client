import { defaultConfig as cfg } from "./config.ts";
import net from "net";
import os from "os";
import {
    encodePacketConnect,
    encodePacketDisconnect,
    encodePacketPing,
    encodePacketInput,
    encodePacketCard,
    decodePacketPong,
    decodePacketLed,
} from "./packets"; // from earlier
import EventEmitter from "./event";

type chuniEvents = {
    "led": (colors: number[]) => void;
}

const AIR_IDX = [4, 5, 2, 3, 0, 1]

export class brokenithm {
    private client: net.Socket;
    private pingInterval: NodeJS.Timeout | undefined = undefined;
    public emitter: EventEmitter<chuniEvents>;
    public currentPacketId: number;

    constructor() {
        this.currentPacketId = 1;
        this.emitter = new EventEmitter();
        this.client = new net.Socket();

        this.client.setNoDelay(true)
        this.client.setKeepAlive(true)

        this.client.connect(cfg.tcpPort, cfg.host, () => {
            /*
            this.pingInterval = setInterval(() => {
                this.client.write(encodePacketPing({
                    remotePingTime: process.hrtime.bigint()
                }))
            }, 100)
            */
        })

        this.client.on('data', data => this.onData(data));
    }

    private onData(data: Buffer) {
        // console.log('Received: ' + data);
        if (decodePacketPong(data)) {
            console.log("PING:", Number(process.hrtime.bigint() - decodePacketPong(data).remotePingTime) * 1e-6 + "ms")
        } else if (decodePacketLed(data)) {
            //console.log('Received: ' + decodePacketLed(data)?.ledRgbData);
            const ledPacket = decodePacketLed(data);
            if (ledPacket)
                this.emitter.emit("led", ledPacket.ledRgbData)
        }
    }

    public sendKeys(slider: boolean[], air: boolean[], service: boolean, test: boolean) {
        // match currentPacketId++ semantics
        const packetId = this.currentPacketId++;

        // air[0..5] → airIoStatus[0..5]
        const airIoStatus = new Array<number>(6).fill(0);
        for (let i = 0; i < Math.min(6, air.length); i++) {
            airIoStatus[AIR_IDX[i] as number] = air[5 - i] ? 1 : 0;
        }

        // slider[0..31] → buffer.slider[31 - i] = 0x80 or 0x00
        const sliderIoStatus = new Array<number>(32).fill(0);
        for (let i = 0; i < Math.min(32, slider.length); i++) {
            sliderIoStatus[i] = slider[31 - i] ? 0x80 : 0x00;
        }

        this.client.write(
            encodePacketInput({
                packetId,
                airIoStatus,
                sliderIoStatus,
                testBtn: test ? 0x01 : 0x00,
                serviceBtn: service ? 0x01 : 0x00,
            })
        );
    }

    destroy() {
        if (this.pingInterval !== undefined)
            clearInterval(this.pingInterval);

        try {
            this.client.write(encodePacketDisconnect())
        } catch (e) {
            console.log(e)
        }

        this.client.destroy();
    }
}