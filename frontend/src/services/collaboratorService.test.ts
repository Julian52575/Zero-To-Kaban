import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
    getCollaborators,
    updateTaskAssignee,
    getAllUsers,
} from './collaboratorService';

const fetchMock = vi.fn();

const ok = (body: unknown) => ({ ok: true, json: async () => body });
const failure = (text: string, status = 500) => ({
    ok: false,
    status,
    text: async () => text,
});

describe('collaboratorService', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    test('getCollaborators fetches the project collaborators', async () => {
        fetchMock.mockResolvedValue(ok([{ id: 'u1' }]));

        await expect(getCollaborators('p1')).resolves.toEqual([{ id: 'u1' }]);
        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1/collaborators');
    });

    test('getCollaborators throws the server message on failure', async () => {
        fetchMock.mockResolvedValue(failure('nope'));

        await expect(getCollaborators('p1')).rejects.toThrow('nope');
    });

    test('getCollaborators falls back to the status when the body is empty', async () => {
        fetchMock.mockResolvedValue(failure('', 503));

        await expect(getCollaborators('p1')).rejects.toThrow(
            'Request failed with status 503',
        );
    });

    test('updateTaskAssignee puts the assignee id', async () => {
        fetchMock.mockResolvedValue({ ok: true });

        await updateTaskAssignee('p1', 't1', 'u2');

        expect(fetchMock).toHaveBeenCalledWith('/api/projects/p1/tasks/t1/assignee', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigneeId: 'u2' }),
        });
    });

    test('updateTaskAssignee throws the server message on failure', async () => {
        fetchMock.mockResolvedValue(failure('forbidden', 403));

        await expect(updateTaskAssignee('p1', 't1', null)).rejects.toThrow('forbidden');
    });

    test('updateTaskAssignee falls back to the status when the body is empty', async () => {
        fetchMock.mockResolvedValue(failure('', 500));

        await expect(updateTaskAssignee('p1', 't1', null)).rejects.toThrow(
            'Request failed with status 500',
        );
    });

    test('getAllUsers fetches every user', async () => {
        fetchMock.mockResolvedValue(ok([{ id: 'u1', pseudo: 'a' }]));

        await expect(getAllUsers()).resolves.toEqual([{ id: 'u1', pseudo: 'a' }]);
        expect(fetchMock).toHaveBeenCalledWith('/auth/users');
    });
});
