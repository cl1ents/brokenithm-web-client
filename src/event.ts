type EventMap = {
    [eventName: string]: (...args: any[]) => void;
};


export default class EventEmitter<T extends EventMap> {
    private listeners: { [K in keyof T]?: Array<T[K]> } = {};

    on<K extends keyof T>(event: K, listener: T[K]): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }

    off<K extends keyof T>(event: K, listener: T[K]): void {
        this.listeners[event] = this.listeners[event]?.filter((l) => l !== listener);
    }

    emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
        this.listeners[event]?.forEach((listener) => listener(...args));
    }
}
