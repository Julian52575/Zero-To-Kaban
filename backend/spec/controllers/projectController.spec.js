jest.mock('../../src/services/projectService');
jest.mock('../../src/events/eventBus', () => ({
    publishEvent: jest.fn(),
}));

const projectService = require('../../src/services/projectService');
const { publishEvent } = require('../../src/events/eventBus');
const { EVENTS } = require('../../src/events/events');
const projectController = require('../../src/controllers/projectController');

const OWNER_ID = '3f9a4c1e-2b7d-4e8a-9c6f-1d2e3f4a5b6c';
const PROJECT_ID = '8c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f';
const CREATED_AT = '2026-09-24T10:00:00.000Z';

const project = {
    id: PROJECT_ID,
    name: 'Mon projet',
    createdAt: new Date(CREATED_AT),
    ownerId: OWNER_ID,
    columns: [{ id: 'col-1', name: 'À faire', order: 0 }],
};

// What projectPayload publishes for `project`.
const published = (p) => ({ ...p, createdAt: CREATED_AT });

const mockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    end: jest.fn(),
});

describe('projectController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createProject', () => {
        it('should create a project for the user and return 201', async () => {
            projectService.createProject.mockResolvedValue(project);

            const req = { userId: OWNER_ID, body: { name: 'Mon projet' } };
            const res = mockRes();

            await projectController.createProject(req, res);

            expect(projectService.createProject).toHaveBeenCalledWith({
                name: 'Mon projet',
                ownerId: OWNER_ID,
            });
            expect(publishEvent).toHaveBeenCalledWith(
                EVENTS.PROJECT_CREATED,
                published(project)
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(project);
        });

        it('should still respond when the event cannot be published', async () => {
            projectService.createProject.mockResolvedValue(project);
            publishEvent.mockRejectedValueOnce(new Error('broker down'));
            const errorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const res = mockRes();
            await projectController.createProject(
                { userId: OWNER_ID, body: { name: 'Mon projet' } },
                res
            );

            expect(res.status).toHaveBeenCalledWith(201);
            errorSpy.mockRestore();
        });
    });

    describe('getProjects', () => {
        it("should return the user's projects", async () => {
            projectService.getProjects.mockResolvedValue([project]);

            const res = mockRes();
            await projectController.getProjects({ userId: OWNER_ID }, res);

            expect(projectService.getProjects).toHaveBeenCalledWith(OWNER_ID);
            expect(res.json).toHaveBeenCalledWith([project]);
        });
    });

    describe('getProject', () => {
        it('should return a project by id', async () => {
            projectService.getProject.mockResolvedValue(project);

            const req = { userId: OWNER_ID, params: { id: PROJECT_ID } };
            const res = mockRes();

            await projectController.getProject(req, res);

            expect(projectService.getProject).toHaveBeenCalledWith(
                PROJECT_ID,
                OWNER_ID
            );
            expect(res.json).toHaveBeenCalledWith(project);
        });

        it('should return 404 when the project is not found', async () => {
            projectService.getProject.mockResolvedValue(null);

            const req = { userId: OWNER_ID, params: { id: 'unknown-id' } };
            const res = mockRes();

            await projectController.getProject(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Project not found',
            });
        });
    });

    describe('updateProject', () => {
        it('should update a project, publish both versions and return it', async () => {
            const updated = { ...project, name: 'Nouveau nom' };
            projectService.updateProject.mockResolvedValue({
                before: project,
                after: updated,
            });

            const req = {
                userId: OWNER_ID,
                params: { id: PROJECT_ID },
                body: { name: 'Nouveau nom' },
            };
            const res = mockRes();

            await projectController.updateProject(req, res);

            expect(projectService.updateProject).toHaveBeenCalledWith(
                PROJECT_ID,
                OWNER_ID,
                req.body
            );
            expect(publishEvent).toHaveBeenCalledWith(EVENTS.PROJECT_UPDATED, {
                id: PROJECT_ID,
                beforeUpdate: published(project),
                afterUpdate: published(updated),
            });
            expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('should return 404 without publishing when the project is not found', async () => {
            projectService.updateProject.mockResolvedValue(null);

            const req = {
                userId: OWNER_ID,
                params: { id: 'unknown-id' },
                body: { name: 'Nouveau nom' },
            };
            const res = mockRes();

            await projectController.updateProject(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(publishEvent).not.toHaveBeenCalled();
        });
    });

    describe('deleteProject', () => {
        it('should delete a project, publish the event and return 200', async () => {
            projectService.deleteProject.mockResolvedValue(project);

            const req = { userId: OWNER_ID, params: { id: PROJECT_ID } };
            const res = mockRes();

            await projectController.deleteProject(req, res);

            expect(projectService.deleteProject).toHaveBeenCalledWith(
                PROJECT_ID,
                OWNER_ID
            );
            expect(publishEvent).toHaveBeenCalledWith(EVENTS.PROJECT_DELETED, {
                projectId: PROJECT_ID,
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.end).toHaveBeenCalledTimes(1);
        });

        it('should return 404 without publishing when the project is not found', async () => {
            projectService.deleteProject.mockResolvedValue(null);

            const req = { userId: OWNER_ID, params: { id: 'unknown-id' } };
            const res = mockRes();

            await projectController.deleteProject(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(publishEvent).not.toHaveBeenCalled();
        });
    });
    describe('getUserProjects', () => {
        it('should return the user projects', async () => {
            projectService.getUserProjects.mockResolvedValue([
                project,
            ]);

            const req = {
                userId: OWNER_ID,
            };

            const res = mockRes();

            await projectController.getUserProjects(req, res);

            expect(
                projectService.getUserProjects
            ).toHaveBeenCalledTimes(1);

            expect(
                projectService.getUserProjects
            ).toHaveBeenCalledWith(OWNER_ID);

            expect(res.json).toHaveBeenCalledWith([
                project,
            ]);

            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return an empty array when the user has no projects', async () => {
            projectService.getUserProjects.mockResolvedValue([]);

            const req = {
                userId: OWNER_ID,
            };

            const res = mockRes();

            await projectController.getUserProjects(req, res);

            expect(
                projectService.getUserProjects
            ).toHaveBeenCalledWith(OWNER_ID);

            expect(res.json).toHaveBeenCalledWith([]);

            expect(res.status).not.toHaveBeenCalled();
        });

        it('should propagate service errors', async () => {
            projectService.getUserProjects.mockRejectedValue(
                new Error('Database error')
            );

            const req = {
                userId: OWNER_ID,
            };

            const res = mockRes();

            await expect(
                projectController.getUserProjects(req, res)
            ).rejects.toThrow('Database error');

            expect(res.json).not.toHaveBeenCalled();
        });
    });
    
    describe('getProjectCollaborators', () => {
        it('should return the project collaborators', async () => {
            const collaborators = [
                {
                    userId: 'u2',
                    role: 'EDITOR',
                    state: 'ACCEPTED',
                },
                {
                    userId: 'u3',
                    role: 'VIEWER',
                    state: 'ACCEPTED',
                },
            ];

            projectService.getProject.mockResolvedValue({
                id: 'p1',
            });

            projectService.getProjectCollaborators.mockResolvedValue(
                collaborators
            );

            const req = {
                params: {
                    id: 'p1',
                },
                userId: 'u1',
            };

            const res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            };

            await projectController.getProjectCollaborators(req, res);

            expect(
                projectService.getProjectCollaborators
            ).toHaveBeenCalledWith('p1');

            expect(res.json).toHaveBeenCalledWith(collaborators);
        });
        it('should return 404 when the project does not exist', async () => {
            projectService.getProject.mockResolvedValue(null);

            const req = {
                params: {
                    id: 'p1',
                },
                userId: 'u1',
            };

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await projectController.getProjectCollaborators(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Project not found',
            });

            expect(
                projectService.getProjectCollaborators
            ).not.toHaveBeenCalled();
        });
    });

    describe('updateProjectCollaborator', () => {
        const req = (body) => ({ params: { id: PROJECT_ID }, userId: 'u2', body });

        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            console.error.mockRestore();
        });

        it('should reject an invalid state', async () => {
            const res = mockRes();

            await projectController.updateProjectCollaborator(req({ state: 'PENDING' }), res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid state' });
            expect(projectService.updateProjectCollaborator).not.toHaveBeenCalled();
        });

        it('should reject a role that would grant ownership', async () => {
            const res = mockRes();

            await projectController.updateProjectCollaborator(
                req({ state: 'ACCEPTED', role: 'OWNER' }),
                res
            );

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid role' });
            expect(projectService.updateProjectCollaborator).not.toHaveBeenCalled();
        });

        it('should return the joined project once accepted', async () => {
            projectService.updateProjectCollaborator.mockResolvedValue({
                before: {},
                after: { state: 'ACCEPTED', role: 'EDITOR', project: { id: PROJECT_ID, name: 'Mon projet', ownerId: OWNER_ID } },
            });
            const res = mockRes();

            await projectController.updateProjectCollaborator(
                req({ state: 'ACCEPTED', role: 'EDITOR' }),
                res
            );

            expect(projectService.updateProjectCollaborator).toHaveBeenCalledWith(
                PROJECT_ID,
                'u2',
                { state: 'ACCEPTED', role: 'EDITOR' }
            );
            expect(res.json).toHaveBeenCalledWith({
                state: 'ACCEPTED',
                role: 'EDITOR',
                project: { id: PROJECT_ID, name: 'Mon projet' },
            });
        });

        it('should only return the state once refused', async () => {
            projectService.updateProjectCollaborator.mockResolvedValue({
                before: {},
                after: { state: 'REFUSED', role: 'VIEWER', project: { id: PROJECT_ID, name: 'Mon projet' } },
            });
            const res = mockRes();

            await projectController.updateProjectCollaborator(req({ state: 'REFUSED' }), res);

            expect(res.json).toHaveBeenCalledWith({ state: 'REFUSED' });
        });

        it('should return 404 when the collaborator does not exist', async () => {
            projectService.updateProjectCollaborator.mockResolvedValue(null);
            const res = mockRes();

            await projectController.updateProjectCollaborator(req({ state: 'ACCEPTED' }), res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Collaborator not found' });
        });

        it('should return 500 when the service fails', async () => {
            projectService.updateProjectCollaborator.mockRejectedValue(new Error('db down'));
            const res = mockRes();

            await projectController.updateProjectCollaborator(req({ state: 'ACCEPTED' }), res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update collaborator' });
        });
    });

    describe('leaveProject', () => {
        const req = { params: { id: PROJECT_ID }, userId: 'u2' };
        const mockSendRes = () => ({ ...mockRes(), send: jest.fn() });

        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            console.error.mockRestore();
        });

        it('should return 204 once the user left', async () => {
            projectService.leaveProject.mockResolvedValue('OK');
            const res = mockSendRes();

            await projectController.leaveProject(req, res);

            expect(projectService.leaveProject).toHaveBeenCalledWith(PROJECT_ID, 'u2');
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it('should return 404 when the user is not a collaborator', async () => {
            projectService.leaveProject.mockResolvedValue('NOT_FOUND');
            const res = mockSendRes();

            await projectController.leaveProject(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Collaborator not found' });
        });

        it('should return 403 for the owner', async () => {
            projectService.leaveProject.mockResolvedValue('OWNER');
            const res = mockSendRes();

            await projectController.leaveProject(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'The owner cannot leave the project' });
        });

        it('should return 500 when the service fails', async () => {
            projectService.leaveProject.mockRejectedValue(new Error('db down'));
            const res = mockSendRes();

            await projectController.leaveProject(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to leave project' });
        });
    });
});
