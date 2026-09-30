import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';
import { connectWebSocket, onWebSocketMessage } from '../services/webSocket';

vi.mock('../services/webSocket', () => ({
    connectWebSocket: vi.fn(),
    onWebSocketMessage: vi.fn(),
}));

describe('useWebSocket', () => {
    test('connects, forwards messages and unsubscribes on unmount', () => {
        const unsubscribe = vi.fn();
        let handler: (message: unknown) => void = () => {};
        vi.mocked(onWebSocketMessage).mockImplementation((cb) => {
            handler = cb;
            return unsubscribe;
        });
        const callback = vi.fn();

        const { unmount } = renderHook(() => useWebSocket(callback));
        handler({ type: 't', data: { a: 1 }, eventId: 'e1' });
        unmount();

        expect(connectWebSocket).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith('t', { a: 1 }, 'e1');
        expect(unsubscribe).toHaveBeenCalled();
    });
});
