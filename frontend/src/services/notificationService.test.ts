import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
    fetchUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from './notificationService';

const fetchMock = vi.fn();

describe('notificationService', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    test('fetchUnreadNotifications parses the JSON body', async () => {
        fetchMock.mockResolvedValue({ ok: true, text: async () => '[{"id":"n1"}]' });

        await expect(fetchUnreadNotifications()).resolves.toEqual([{ id: 'n1' }]);
        expect(fetchMock).toHaveBeenCalledWith('/api/notifications/unread', undefined);
    });

    test('an empty body resolves to undefined', async () => {
        fetchMock.mockResolvedValue({ ok: true, text: async () => '' });

        await expect(markNotificationAsRead('n1')).resolves.toBeUndefined();
        expect(fetchMock).toHaveBeenCalledWith('/api/notifications/n1/read', {
            method: 'PATCH',
        });
    });

    test('markAllNotificationsAsRead patches the collection', async () => {
        fetchMock.mockResolvedValue({ ok: true, text: async () => '' });

        await markAllNotificationsAsRead();

        expect(fetchMock).toHaveBeenCalledWith('/api/notifications/read', {
            method: 'PATCH',
        });
    });

    test('deleteNotification deletes by id', async () => {
        fetchMock.mockResolvedValue({ ok: true, text: async () => '' });

        await deleteNotification('n1');

        expect(fetchMock).toHaveBeenCalledWith('/api/notifications/n1', {
            method: 'DELETE',
        });
    });

    test('a failed request throws with the path and status', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500 });

        await expect(fetchUnreadNotifications()).rejects.toThrow(
            'Request to /notifications/unread failed with status 500',
        );
    });
});
