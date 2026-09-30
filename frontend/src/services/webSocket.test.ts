import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

class FakeSocket {
    static OPEN = 1;
    static instances: FakeSocket[] = [];
    readyState = 0;
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    listeners = new Map<string, (e: unknown) => void>();
    close = vi.fn();
    constructor(public url: string) {
        FakeSocket.instances.push(this);
    }
    addEventListener = vi.fn((type: string, fn: (e: unknown) => void) => {
        this.listeners.set(type, fn);
    });
    removeEventListener = vi.fn();
}

describe('webSocket', () => {
    let mod: typeof import('./webSocket');

    beforeEach(async () => {
        vi.resetModules();
        FakeSocket.instances = [];
        vi.stubGlobal('WebSocket', FakeSocket);
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        mod = await import('./webSocket');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('connectWebSocket opens one socket and reuses it while open', () => {
        const first = mod.connectWebSocket() as unknown as FakeSocket;
        expect(first.url).toBe('ws://localhost:8000/ws');

        first.readyState = FakeSocket.OPEN;
        expect(mod.connectWebSocket()).toBe(first);
        expect(FakeSocket.instances).toHaveLength(1);
    });

    test('lifecycle handlers log, and close forgets the socket', () => {
        const socket = mod.connectWebSocket() as unknown as FakeSocket;

        socket.onopen?.();
        socket.onerror?.('boom');
        socket.onclose?.();

        expect(console.log).toHaveBeenCalledWith('WebSocket connected');
        expect(console.error).toHaveBeenCalledWith('WebSocket error:', 'boom');
        expect(console.log).toHaveBeenCalledWith('WebSocket disconnected');
        expect(mod.connectWebSocket()).not.toBe(socket);
    });

    test('disconnectWebSocket closes the socket, and is a no-op without one', () => {
        mod.disconnectWebSocket();

        const socket = mod.connectWebSocket() as unknown as FakeSocket;
        mod.disconnectWebSocket();

        expect(socket.close).toHaveBeenCalledTimes(1);
    });

    test('onWebSocketMessage throws when not connected', () => {
        expect(() => mod.onWebSocketMessage(vi.fn())).toThrow(
            'WebSocket is not connected',
        );
    });

    test('onWebSocketMessage parses messages and can unsubscribe', () => {
        const socket = mod.connectWebSocket() as unknown as FakeSocket;
        const callback = vi.fn();

        const unsubscribe = mod.onWebSocketMessage(callback);
        socket.listeners.get('message')?.({ data: '{"type":"x"}' });
        unsubscribe();

        expect(callback).toHaveBeenCalledWith({ type: 'x' });
        expect(socket.removeEventListener).toHaveBeenCalled();
    });
});
