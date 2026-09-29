jest.mock('../../src/events/eventBus', () => ({
    publishEvent: jest.fn(),
}));

jest.mock('../../src/repositories/projectRepository', () => {
    const mockProjects = new Map();

    return {
        create: jest.fn(async (project) => {
            const stored = { ...project, createdAt: new Date(), columns: [] };
            mockProjects.set(project.id, stored);
            return stored;
        }),
        getAll: jest.fn(async () => [...mockProjects.values()]),
        
        getAllFromUser: jest.fn(async (userId) => {
            return [...mockProjects.values()].filter(
                (project) => project.ownerId === userId
            );
        }),

        getById: jest.fn(async (id) => mockProjects.get(id) ?? null),
        update: jest.fn(async (id, data) => {
            const project = { ...mockProjects.get(id), ...data };
            mockProjects.set(id, project);
            return project;
        }),
        deleteProject: jest.fn(async (id) => {
            const project = mockProjects.get(id);
            mockProjects.delete(id);
            return project;
        }),
    };
});

const { publishEvent } = require('../../src/events/eventBus');
const request = require('supertest');
const app = require('../../src/app');

const OWNER = '3f9a4c1e-2b7d-4e8a-9c6f-1d2e3f4a5b6c';
const INTRUDER = '7b8c9d0e-1f2a-4b3c-8d4e-5f6a7b8c9d0e';

// Traefik injects the authenticated user as X-Auth-User-Id.
const as = (userId) => ({
    get: (url) => request(app).get(url).set('X-Auth-User-Id', userId),
    post: (url) => request(app).post(url).set('X-Auth-User-Id', userId),
    put: (url) => request(app).put(url).set('X-Auth-User-Id', userId),
    delete: (url) => request(app).delete(url).set('X-Auth-User-Id', userId),
});

async function createProject(name) {
    const response = await as(OWNER).post('/projects').send({ name });
    return response.body.id;
}

describe('Project routes', () => {
    describe('POST /projects', () => {
        it('should create a project', async () => {
            const response = await as(OWNER)
                .post('/projects')
                .send({
                    name: 'Mon projet',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe('Mon projet');
            expect(response.body.ownerId).toBe(OWNER);
            expect(publishEvent).toHaveBeenCalledWith(
                'project.created.v1',
                expect.objectContaining({ id: response.body.id, ownerId: OWNER })
            );
        });

        it('should reject a project without a name', async () => {
            const response = await as(OWNER)
                .post('/projects')
                .send({});

            expect(response.status).toBe(400);
        });

        it('should reject a project with an invalid name', async () => {
            const response = await as(OWNER)
                .post('/projects')
                .send({
                    name: 123,
                });

            expect(response.status).toBe(400);
        });

        it('should reject an empty project name', async () => {
            const response = await as(OWNER)
                .post('/projects')
                .send({
                    name: '   ',
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /projects', () => {
        it('should return the list of projects', async () => {
            const response = await as(OWNER)
                .get('/projects');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return created projects in the list', async () => {
            await as(OWNER)
                .post('/projects')
                .send({
                    name: 'Projet listing',
                });

            const response = await as(OWNER)
                .get('/projects');

            expect(response.status).toBe(200);

            const project = response.body.find(
                (project) => project.name === 'Projet listing'
            );

            expect(project).toBeDefined();
            expect(project).toHaveProperty('id');
            expect(project).toHaveProperty(
                'name',
                'Projet listing'
            );
        });
    });

    describe('GET /projects/:id', () => {
        it('should return a project by its id', async () => {
            const createResponse = await as(OWNER)
                .post('/projects')
                .send({
                    name: 'Projet selection',
                });

            const projectId = createResponse.body.id;

            const response = await as(OWNER)
                .get(`/projects/${projectId}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty(
                'id',
                projectId
            );
            expect(response.body).toHaveProperty(
                'name',
                'Projet selection'
            );
        });

        it('should return 404 when project does not exist', async () => {
            const response = await as(OWNER)
                .get(
                    '/projects/00000000-0000-0000-0000-000000000000'
                );

            expect(response.status).toBe(404);

            expect(response.body).toEqual({
                error: 'Project not found',
            });
        });

        it("should return 404 for someone else's project", async () => {
            const projectId = await createProject('Projet privé');

            const response = await as(INTRUDER).get(`/projects/${projectId}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /projects/:id', () => {
        it('should rename a project', async () => {
            const projectId = await createProject('Ancien nom');

            const response = await as(OWNER)
                .put(`/projects/${projectId}`)
                .send({ name: '  Nouveau nom  ', createdAt: new Date() });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('name', 'Nouveau nom');
        });

        it('should reject a missing name', async () => {
            const projectId = await createProject('Projet');

            const response = await as(OWNER)
                .put(`/projects/${projectId}`)
                .send({});

            expect(response.status).toBe(400);
        });

        it("should not rename someone else's project", async () => {
            const projectId = await createProject('Projet privé');

            const response = await as(INTRUDER)
                .put(`/projects/${projectId}`)
                .send({ name: 'Piraté' });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /projects/:id', () => {
        it('should delete a project', async () => {
            const projectId = await createProject('À supprimer');

            const response = await as(OWNER).delete(`/projects/${projectId}`);

            expect(response.status).toBe(200);
            expect(
                (await as(OWNER).get(`/projects/${projectId}`)).status
            ).toBe(404);
        });

        it("should not delete someone else's project", async () => {
            const projectId = await createProject('Projet privé');

            const response = await as(INTRUDER).delete(
                `/projects/${projectId}`
            );

            expect(response.status).toBe(404);
            expect(
                (await as(OWNER).get(`/projects/${projectId}`)).status
            ).toBe(200);
        });
    });

    it('should reject requests without an authenticated user', async () => {
        const response = await request(app).get('/projects');

        expect(response.status).toBe(401);
    });
    describe('GET /users/:id/projects', () => {
        it('should return the projects of the requested user', async () => {
            await as(OWNER)
                .post('/projects')
                .send({
                    name: 'Projet utilisateur',
                });

            const response = await as(OWNER)
                .get(`/users/${OWNER}/projects`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            expect(
                response.body.some(
                    (project) => project.name === 'Projet utilisateur'
                )
            ).toBe(true);
        });

        it('should return an empty array when the user has no projects', async () => {
            const response = await as(OWNER)
                .get(
                    '/users/00000000-0000-4000-8000-000000000001/projects'
                );

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should reject an invalid user id', async () => {
            const response = await as(OWNER)
                .get('/users/not-a-valid-uuid/projects');

            expect(response.status).toBe(400);
        });

        it('should reject an empty user id', async () => {
            const response = await as(OWNER)
                .get('/users//projects');

            // Express ne matche normalement pas cette route.
            expect([400, 404]).toContain(response.status);
        });

        it('should reject a missing authentication header', async () => {
            const response = await request(app)
                .get(`/users/${OWNER}/projects`);

            expect(response.status).toBe(401);
        });

        it('should accept a valid uuid even when the user has no projects', async () => {
            const unknownUserId =
                '00000000-0000-4000-8000-000000000002';

            const response = await as(OWNER)
                .get(`/users/${unknownUserId}/projects`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });
});
