// packets.ts
import {
    u8, u16, u32, u64,
    arr, str, struct, union,
    encodeStruct, type StructField,
    sizeof, sizeofStruct,
    decodeStruct
} from "./structbuilder";

// -------------------------------------------------
// IPCMemoryInfo
// -------------------------------------------------

export interface IPCMemoryInfo {
    airIoStatus: number[];
    sliderIoStatus: number[];
    ledRgbData: number[];
    testBtn: number;
    serviceBtn: number;
    coinInsertion: number;
    cardRead: number;
    remoteCardRead: number;
    remoteCardType: number;
    remoteCardId: number[];
}

export const IPCMemoryInfoStruct: StructField[] = [
    { name: "airIoStatus", type: arr(6, u8()) },
    { name: "sliderIoStatus", type: arr(32, u8()) },
    { name: "ledRgbData", type: arr(96, u8()) },
    { name: "testBtn", type: u8() },
    { name: "serviceBtn", type: u8() },
    { name: "coinInsertion", type: u8() },
    { name: "cardRead", type: u8() },
    { name: "remoteCardRead", type: u8() },
    { name: "remoteCardType", type: u8() },
    { name: "remoteCardId", type: arr(10, u8()) },
];

// -------------------------------------------------
// PacketInput (INP)
// -------------------------------------------------

export interface PacketInput {
    packetId: number;
    airIoStatus: number[];
    sliderIoStatus: number[];
    testBtn: number;
    serviceBtn: number;
}

export const PacketInputStruct: StructField[] = [
    { name: "packetSize", type: u8() },
    { name: "packetName", type: str(3) },
    { name: "packetId", type: u32("be") },
    { name: "airIoStatus", type: arr(6, u8()) },
    { name: "sliderIoStatus", type: arr(32, u8()) },
    { name: "testBtn", type: u8() },
    { name: "serviceBtn", type: u8() },
];

export const PACKET_INPUT_NAME = "INP";
export const PACKET_INPUT_SIZE = sizeofStruct(PacketInputStruct);

export function encodePacketInput(data: PacketInput): Buffer {
    return encodeStruct(PacketInputStruct, {
        packetSize: PACKET_INPUT_SIZE,
        packetName: PACKET_INPUT_NAME,
        ...data
    });
}

// -------------------------------------------------
// PacketInputNoAir (IPT)
// -------------------------------------------------

export interface PacketInputNoAir {
    packetId: number;
    sliderIoStatus: number[];
    testBtn: number;
    serviceBtn: number;
}

export const PacketInputNoAirStruct: StructField[] = [
    { name: "packetSize", type: u8() },
    { name: "packetName", type: str(3) },
    { name: "packetId", type: u32("be") },
    { name: "sliderIoStatus", type: arr(32, u8()) },
    { name: "testBtn", type: u8() },
    { name: "serviceBtn", type: u8() },
];

export const PACKET_INPUT_NO_AIR_NAME = "IPT";
export const PACKET_INPUT_NO_AIR_SIZE = sizeofStruct(PacketInputNoAirStruct);

export function encodePacketInputNoAir(data: PacketInputNoAir): Buffer {
    return encodeStruct(PacketInputNoAirStruct, {
        packetSize: PACKET_INPUT_NO_AIR_SIZE,
        packetName: PACKET_INPUT_NO_AIR_NAME,
        ...data
    });
}

// -------------------------------------------------
// PacketFunction (FNC)
// -------------------------------------------------

export interface PacketFunction {
    funcBtn: number;
}

export const PacketFunctionStruct: StructField[] = [
    { name: "packetSize", type: u8() },
    { name: "packetName", type: str(3) },
    { name: "funcBtn", type: u8() },
];

export const PACKET_FUNCTION_NAME = "FNC";
export const PACKET_FUNCTION_SIZE = sizeofStruct(PacketFunctionStruct);

export function encodePacketFunction(data: PacketFunction): Buffer {
    return encodeStruct(PacketFunctionStruct, {
        packetSize: PACKET_FUNCTION_SIZE,
        packetName: PACKET_FUNCTION_NAME,
        ...data
    });
}

// -------------------------------------------------
// PacketConnect (CON)
// -------------------------------------------------

export interface PacketConnect {
    addrType: number;
    port: number;
    addr: {
        addr4?: { addr: number[]; padding: number[] };
        addr6?: number[];
    };
}

export const PacketConnectStruct: StructField[] = [
    { name: "packetSize", type: u8() },
    { name: "packetName", type: str(3) },
    { name: "addrType", type: u8() },
    { name: "port", type: u16("be") },
    {
        name: "addr",
        type: union([
            {
                name: "addr4",
                type: struct([
                    { name: "addr", type: arr(4, u8()) },
                    { name: "padding", type: arr(12, u8()) },
                ])
            },
            {
                name: "addr6",
                type: arr(16, u8())
            }
        ])
    }
];

export const PACKET_CONNECT_NAME = "CON";
export const PACKET_CONNECT_SIZE = sizeofStruct(PacketConnectStruct);

export function encodePacketConnect(data: PacketConnect): Buffer {
    return encodeStruct(PacketConnectStruct, {
        packetSize: PACKET_CONNECT_SIZE,
        packetName: PACKET_CONNECT_NAME,
        ...data
    });
}

// -------------------------------------------------
// PacketCard (CRD)
// -------------------------------------------------

export interface PacketCard {
    remoteCardRead: number;
    remoteCardType: number;
    remoteCardId: number[];
}

export const PacketCardStruct: StructField[] = [
    { name: "packetSize", type: u8() },
    { name: "packetName", type: str(3) },
    { name: "remoteCardRead", type: u8() },
    { name: "remoteCardType", type: u8() },
    { name: "remoteCardId", type: arr(10, u8()) },
];

export const PACKET_CARD_NAME = "CRD";
export const PACKET_CARD_SIZE = sizeofStruct(PacketCardStruct);

export function encodePacketCard(data: PacketCard): Buffer {
    return encodeStruct(PacketCardStruct, {
        packetSize: PACKET_CARD_SIZE,
        packetName: PACKET_CARD_NAME,
        ...data
    });
}

// -------------------------------------------------
// PacketPing (PIN)
// -------------------------------------------------

export interface PacketPing {
    remotePingTime: bigint;
}

export const PacketPingStruct: StructField[] = [
    { name: "packetSize", type: u8() },
    { name: "packetName", type: str(3) },
    { name: "remotePingTime", type: u64("be") },
];

export const PACKET_PING_NAME = "PIN";
export const PACKET_PING_SIZE = sizeofStruct(PacketPingStruct);

export function encodePacketPing(data: PacketPing): Buffer {
    return encodeStruct(PacketPingStruct, {
        packetSize: PACKET_PING_SIZE,
        packetName: PACKET_PING_NAME,
        ...data
    });
}

export function decodePacketPong(buffer: Buffer) {
    if (buffer.length < 12) return null;

    // Check packet name "PON"
    if (
        buffer[1] !== 0x50 || // P
        buffer[2] !== 0x4F || // O
        buffer[3] !== 0x4E    // N
    ) {
        return null;
    }

    return decodeStruct(PacketPingStruct, buffer);
}

// -------------------------------------------------
// PacketDisconnect (DIS)
// -------------------------------------------------

export const PacketDisconnectStruct: StructField[] = [
    { name: "packetSize", type: u8() },
    { name: "packetName", type: str(3) },
];

export const PACKET_DISCONNECT_NAME = "DIS";
export const PACKET_DISCONNECT_SIZE = sizeofStruct(PacketDisconnectStruct);

export function encodePacketDisconnect(): Buffer {
    return encodeStruct(PacketDisconnectStruct, {
        packetSize: PACKET_DISCONNECT_SIZE,
        packetName: PACKET_DISCONNECT_NAME
    });
}

// -------------------------------------------------
// PacketLed (LED)
// -------------------------------------------------

export interface PacketLed {
    packetSize: number;     // 100
    packetName: string;     // "LED"
    ledRgbData: number[];   // 32 * 3 = 96 bytes
}

export const PacketLedStruct: StructField[] = [
    { name: "packetSize", type: u8() },
    { name: "packetName", type: str(3) },
    { name: "ledRgbData", type: arr(32 * 3, u8()) },
];

export function decodePacketLed(buffer: Buffer): PacketLed | null {
    if (buffer.length < 100) return null;
    if (
        buffer[1] !== 0x4c || // 'L'
        buffer[2] !== 0x45 || // 'E'
        buffer[3] !== 0x44    // 'D'
    ) {
        return null;
    }

    return decodeStruct(PacketLedStruct, buffer) as PacketLed;
}