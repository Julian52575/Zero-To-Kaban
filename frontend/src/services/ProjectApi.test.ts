import { describe, test, expect, vi, beforeEach } from 'vitest';
import apiClient from './apiClient';
import { getProjects, createProject, updateProject, deleteProject } from './ProjectApi';

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
});
