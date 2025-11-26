export type Transport = "udp" | "tcp";

export interface AppConfig {
    host: string;         // IP / hostname of the server (your PC)
    udpPort: number;
    tcpPort: number;
    webPort: number
}

export const defaultConfig: AppConfig = {
    host: process.env.BROKENITHM_HOST ?? "127.0.0.1",
    udpPort: Number(process.env.BROKENITHM_UDP_PORT ?? "52468"),
    tcpPort: Number(process.env.BROKENITHM_TCP_PORT ?? "52468"),
    webPort: Number(process.env.BROKENITHM_UDP_PORT ?? "8888"),
};