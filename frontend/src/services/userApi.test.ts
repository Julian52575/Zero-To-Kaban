import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getCurrentUser, updateMe, deleteMe, logout, downloadUserData } from './userApi';

const fetchMock = vi.fn();

describe('userApi', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    test('getCurrentUser returns the profile', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'u1' }) });

        await expect(getCurrentUser()).resolves.toEqual({ id: 'u1' });
        expect(fetchMock).toHaveBeenCalledWith('/auth/me');
    });

    test('getCurrentUser throws on failure', async () => {
        fetchMock.mockResolvedValue({ ok: false });

        await expect(getCurrentUser()).rejects.toThrow('Failed to retrieve user profile');
    });

    test('updateMe patches the username', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'u1' }) });

        await expect(updateMe('bob')).resolves.toEqual({ id: 'u1' });
        expect(fetchMock).toHaveBeenCalledWith('/auth/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'bob' }),
        });
    });

    test('updateMe throws on failure', async () => {
        fetchMock.mockResolvedValue({ ok: false });

        await expect(updateMe('bob')).rejects.toThrow('Failed to update user profile');
    });

    test('deleteMe deletes the account', async () => {
        fetchMock.mockResolvedValue({ ok: true });

        await deleteMe();

        expect(fetchMock).toHaveBeenCalledWith('/auth/me', { method: 'DELETE' });
    });

    test('deleteMe throws on failure', async () => {
        fetchMock.mockResolvedValue({ ok: false });

        await expect(deleteMe()).rejects.toThrow('Failed to delete user account');
    });

    test('logout posts to logout-all', async () => {
        fetchMock.mockResolvedValue({ ok: true });

        await logout();

        expect(fetchMock).toHaveBeenCalledWith('/auth/logout-all', { method: 'POST' });
    });

    test('logout throws on failure', async () => {
        fetchMock.mockResolvedValue({ ok: false });

        await expect(logout()).rejects.toThrow('Failed to logout');
    });

    test('downloadUserData returns the export blob', async () => {
        const blob = new Blob(['x']);
        fetchMock.mockResolvedValue({ ok: true, blob: async () => blob });

        await expect(downloadUserData()).resolves.toBe(blob);
        expect(fetchMock).toHaveBeenCalledWith('/auth/me/export', { method: 'GET' });
    });

    test('downloadUserData throws on failure', async () => {
        fetchMock.mockResolvedValue({ ok: false });

        await expect(downloadUserData()).rejects.toThrow('Failed to download user data');
    });
});
