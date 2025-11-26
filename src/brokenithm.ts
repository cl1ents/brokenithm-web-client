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

export class brokenithm {
    private client: net.Socket;
    private pingInterval: NodeJS.Timeout | undefined = undefined;
    private testInterval: NodeJS.Timeout | undefined = undefined;
    public emitter: EventEmitter<chuniEvents>;
    public currentPacketId: number;

    public slider: boolean[] = Array<boolean>(32);
    public air: boolean[] = Array<boolean>(6);
    public service: boolean = false;
    public test: boolean = false;

    constructor() {
        this.currentPacketId = 1;
        this.emitter = new EventEmitter();
        this.client = new net.Socket();

        this.client.setNoDelay(true)
        this.client.connect(cfg.tcpPort, cfg.host, () => {
            this.pingInterval = setInterval(() => {
                this.client.write(encodePacketPing({
                    remotePingTime: process.hrtime.bigint()
                }))
            }, 100)

            this.testInterval = setInterval(() => {
                // match currentPacketId++ semantics
                const packetId = this.currentPacketId++;
                //this.currentPacketId %= 100

                // air[0..5] → airIoStatus[0..5]
                const airIoStatus = new Array<number>(6).fill(0);
                for (let i = 0; i < 32; i++) {
                    airIoStatus[i] = this.air[i] ? 1 : 0;
                }

                // slider[0..31] → buffer.slider[31 - i] = 0x80 or 0x00
                const sliderIoStatus = new Array<number>(32).fill(0);
                for (let i = 0; i < 32; i++) {
                    sliderIoStatus[31 - i] = this.slider[i] ? 0x80 : 0x00;
                }


                this.client.write(
                    encodePacketInput({
                        packetId,
                        airIoStatus,
                        sliderIoStatus,
                        testBtn: this.test ? 0x01 : 0x00,
                        serviceBtn: this.service ? 0x01 : 0x00,
                    })
                );
            }, 1000 / 120)
        })

        this.client.on('data', data => this.onData(data));
    }

    private onData(data: Buffer) {
        // console.log('Received: ' + data);
        if (decodePacketPong(data)) {
            //console.log("PING:", Number(process.hrtime.bigint() - decodePacketPong(data).remotePingTime) * 1e-6 + "ms")
        } else if (decodePacketLed(data)) {
            //console.log('Received: ' + decodePacketLed(data)?.ledRgbData);
            const ledPacket = decodePacketLed(data);
            if (ledPacket)
                this.emitter.emit("led", ledPacket.ledRgbData)
        }
    }

    public sendKeys(slider: boolean[], air: boolean[], service: boolean, test: boolean) {
        // match currentPacketId++ semantics
        //const packetId = this.currentPacketId++;
        //this.currentPacketId %= 100
        //console.log(slider, air, packetId)

        // air[0..5] → airIoStatus[0..5]
        //const airIoStatus = new Array<number>(6).fill(0);
        for (let i = 0; i < Math.min(6, air.length); i++) {
            this.air[i] = air[i] ? true : false; //? 1 : 0;
        }

        // slider[0..31] → buffer.slider[31 - i] = 0x80 or 0x00
        //const sliderIoStatus = new Array<number>(32).fill(0);
        for (let i = 0; i < Math.min(32, slider.length); i++) {
            this.slider[i] = slider[i] ? true : false; //? 1 : 0;
            //sliderIoStatus[31 - i] = slider[i] ? 0x80 : 0x00;
        }

        /*
        this.client.write(
            encodePacketInput({
                packetId,
                airIoStatus,
                sliderIoStatus,
                testBtn: test ? 0x01 : 0x00,
                serviceBtn: service ? 0x01 : 0x00,
            })
        );*/
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