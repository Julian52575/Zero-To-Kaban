import { describe, test, expect, vi, beforeEach } from 'vitest';
import apiClient from './apiClient';
import {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    inviteCollaborator,
    AcceptInvitation,
    declineInvitation,
    getProjectCollaborators,
} from './ProjectApi';

const perms = { role: 'OWNER', isOwner: true, canEdit: true, canManage: true };

vi.mock('./apiClient', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const api = vi.mocked(apiClient);

describe('ProjectApi', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test('getProjects converts createdAt to a Date', async () => {
        api.get.mockResolvedValue([
            { id: '1', name: 'A', createdAt: '2026-01-01T00:00:00.000Z', ...perms },
            { id: '2', name: 'B', ...perms },
        ]);

        const projects = await getProjects();

        expect(api.get).toHaveBeenCalledWith('/api/projects');
        expect(projects).toHaveLength(2);
        expect(projects[0].createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
        expect(projects[1].createdAt).toBeInstanceOf(Date);
    });

    test('getProjects rejects malformed data', async () => {
        api.get.mockResolvedValue([{ id: 1 }]);
        await expect(getProjects()).rejects.toThrow();
    });

    test('createProject posts the name and parses the result', async () => {
        api.post.mockResolvedValue({ id: '1', name: 'A', createdAt: '2026-01-01T00:00:00.000Z' });

        const project = await createProject('A');

        expect(api.post).toHaveBeenCalledWith('/api/projects', { name: 'A' });
        expect(project).toEqual({
            id: '1',
            name: 'A',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            ...perms,
        });
    });

    test('createProject defaults createdAt when missing', async () => {
        api.post.mockResolvedValue({ id: '1', name: 'A' });
        const project = await createProject('A');
        expect(project.createdAt).toBeInstanceOf(Date);
    });

    test('updateProject puts the name and createdAt', async () => {
        const createdAt = new Date('2026-01-01T00:00:00.000Z');
        api.put.mockResolvedValue({ id: '1', name: 'B', createdAt: createdAt.toISOString(), ...perms });

        const project = await updateProject({ id: '1', name: 'B', createdAt, ...perms } as any);

        expect(api.put).toHaveBeenCalledWith('/api/projects/1', { name: 'B', createdAt });
        expect(project).toEqual({ id: '1', name: 'B', createdAt, ...perms });
    });

    test('updateProject defaults createdAt when missing', async () => {
        api.put.mockResolvedValue({ id: '1', name: 'B', ...perms });
        const project = await updateProject({ id: '1', name: 'B', ...perms } as any);
        expect(project.createdAt).toBeInstanceOf(Date);
    });

    test('deleteProject calls the project URL', async () => {
        api.delete.mockResolvedValue(undefined);
        await deleteProject('1');
        expect(api.delete).toHaveBeenCalledWith('/api/projects/1');
    });

    test('getProject fetches one project and converts createdAt', async () => {
        api.get.mockResolvedValue({ id: '1', name: 'A', createdAt: '2026-01-01T00:00:00.000Z', ...perms });

        const project = await getProject('1');

        expect(api.get).toHaveBeenCalledWith('/api/projects/1');
        expect(project.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    });

    test('getProject defaults createdAt when missing', async () => {
        api.get.mockResolvedValue({ id: '1', name: 'A', ...perms });

        expect((await getProject('1')).createdAt).toBeInstanceOf(Date);
    });

    test('inviteCollaborator posts the user id', async () => {
        api.post.mockResolvedValue({ ok: 1 });

        await expect(inviteCollaborator('p1', 'u2')).resolves.toEqual({ ok: 1 });
        expect(api.post).toHaveBeenCalledWith('/api/projects/p1/invitation', { userId: 'u2' });
    });

    test('AcceptInvitation puts an accepted editor state', async () => {
        api.put.mockResolvedValue({ ok: 1 });

        await AcceptInvitation('p1', 'u2');

        expect(api.put).toHaveBeenCalledWith('/api/projects/p1/invitation', {
            userId: 'u2',
            role: 'EDITOR',
            state: 'ACCEPTED',
        });
    });

    test('declineInvitation puts a refused state', async () => {
        api.put.mockResolvedValue({ ok: 1 });

        await declineInvitation('p1', 'u2');

        expect(api.put).toHaveBeenCalledWith('/api/projects/p1/invitation', {
            userId: 'u2',
            state: 'REFUSED',
        });
    });

    test('getProjectCollaborators returns the collaborators', async () => {
        api.get.mockResolvedValue([{ id: 'u1', pseudo: 'a' }]);

        await expect(getProjectCollaborators('p1')).resolves.toEqual([{ id: 'u1', pseudo: 'a' }]);
        expect(api.get).toHaveBeenCalledWith('/api/projects/p1/collaborators');
    });
});
