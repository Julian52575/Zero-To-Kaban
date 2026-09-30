jest.mock('../../src/events/eventBus', () => ({
    publishEvent: jest.fn(),
}));

// In-memory stand-in for the database: alice owns p1, bob owns p2.
jest.mock('../../src/persistence', () => {
    const owners = { p1: 'alice', p2: 'bob' };
    const columnProjects = { c1: 'p1', c2: 'p1', c9: 'p2' };
    const task = (id, columnId) => ({
        id,
        title: `Task ${id}`,
        description: null,
        order: 0,
        columnId,
        creatorId: owners[columnProjects[columnId]],
        assigneeId: null,
        column: { id: columnId, projectId: columnProjects[columnId] },
    });
    const tasks = { t1: task('t1', 'c1'), t9: task('t9', 'c9') };

    return {
        userCanAccessProject: jest.fn(
            async (userId, projectId) => owners[projectId] === userId
        ),
        userCanEditProject: jest.fn(
            async (userId, projectId) => owners[projectId] === userId
        ),
        columnBelongsToProject: jest.fn(
            async (columnId, projectId) => columnProjects[columnId] === projectId
        ),
        getTasks: jest.fn(async (projectId) =>
            Object.values(tasks).filter(
                (t) => t.column.projectId === projectId
            )
        ),
        getTask: jest.fn(async (id) => tasks[id] ?? null),
        storeTask: jest.fn(async (columnId, creatorId, data) => ({
            ...task('new', columnId),
            ...data,
            creatorId,
        })),
        updateTask: jest.fn(async (id, data) => ({ ...tasks[id], ...data })),
        deleteTask: jest.fn(async (id) => tasks[id]),
    };
});

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/persistence');
const { publishEvent } = require('../../src/events/eventBus');
const { EVENTS } = require('../../src/events/events');

const as = (userId) => ({
    get: (url) => request(app).get(url).set('X-Auth-User-Id', userId),
    post: (url) => request(app).post(url).set('X-Auth-User-Id', userId),
    put: (url) => request(app).put(url).set('X-Auth-User-Id', userId),
    delete: (url) => request(app).delete(url).set('X-Auth-User-Id', userId),
});

describe('Task routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /projects/:projectId/tasks', () => {
        it('lists the tasks of an owned project', async () => {
            const response = await as('alice').get('/projects/p1/tasks');

            expect(response.status).toBe(200);
            expect(response.body.map((t) => t.id)).toEqual(['t1']);
        });

        it("hides someone else's project", async () => {
            const response = await as('bob').get('/projects/p1/tasks');

            expect(response.status).toBe(404);
            expect(db.getTasks).not.toHaveBeenCalled();
        });
    });

    describe('GET /projects/:projectId/tasks/:id', () => {
        it('returns a task of the project', async () => {
            const response = await as('alice').get('/projects/p1/tasks/t1');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', 't1');
        });

        it('does not serve a task through another project', async () => {
            const response = await as('alice').get('/projects/p1/tasks/t9');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /projects/:projectId/tasks', () => {
        it('creates a task in a column of the project', async () => {
            const response = await as('alice')
                .post('/projects/p1/tasks')
                .send({ title: 'New', columnId: 'c1' });

            expect(response.status).toBe(201);
            expect(db.storeTask).toHaveBeenCalledWith('c1', 'alice', {
                title: 'New',
                description: undefined,
                assigneeId: undefined,
            });
            expect(publishEvent).toHaveBeenCalledWith(
                EVENTS.TASK_CREATED,
                expect.objectContaining({ projectId: 'p1', title: 'New' })
            );
        });

        it('rejects a column of another project', async () => {
            const response = await as('alice')
                .post('/projects/p1/tasks')
                .send({ title: 'New', columnId: 'c9' });

            expect(response.status).toBe(400);
            expect(db.storeTask).not.toHaveBeenCalled();
        });
    });

    describe('PUT /projects/:projectId/tasks/:id', () => {
        it('moves a task the way the kanban board does', async () => {
            // frontend moveTask(): no projectId in the body
            const response = await as('alice')
                .put('/projects/p1/tasks/t1')
                .send({ columnId: 'c2', order: 3 });

            expect(response.status).toBe(200);
            expect(db.updateTask).toHaveBeenCalledWith('t1', {
                columnId: 'c2',
                order: 3,
            });
            expect(publishEvent).toHaveBeenCalledWith(
                EVENTS.TASK_UPDATED,
                expect.objectContaining({ taskId: 't1', projectId: 'p1' })
            );
        });

        it('ignores a projectId smuggled in the body', async () => {
            const response = await as('bob')
                .put('/projects/p1/tasks/t1')
                .send({ projectId: 'p2', title: 'Hijacked' });

            expect(response.status).toBe(404);
            expect(db.updateTask).not.toHaveBeenCalled();
        });

        it('does not edit a task through a project it is not in', async () => {
            const response = await as('bob')
                .put('/projects/p2/tasks/t1')
                .send({ title: 'Hijacked' });

            expect(response.status).toBe(404);
            expect(db.updateTask).not.toHaveBeenCalled();
        });

        it('rejects a move to a column of another project', async () => {
            const response = await as('alice')
                .put('/projects/p1/tasks/t1')
                .send({ columnId: 'c9', order: 0 });

            expect(response.status).toBe(400);
            expect(db.updateTask).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /projects/:projectId/tasks/:id', () => {
        it('deletes a task of an owned project', async () => {
            const response = await as('alice').delete('/projects/p1/tasks/t1');

            expect(response.status).toBe(204);
            expect(db.deleteTask).toHaveBeenCalledWith('t1');
            expect(publishEvent).toHaveBeenCalledWith(EVENTS.TASK_DELETED, {
                taskId: 't1',
            });
        });

        it("refuses to delete a task of someone else's project", async () => {
            const response = await as('bob').delete('/projects/p2/tasks/t1');

            expect(response.status).toBe(403);
            expect(db.deleteTask).not.toHaveBeenCalled();
        });

        it('answers 404 for an unknown task', async () => {
            const response = await as('alice').delete(
                '/projects/p1/tasks/nope'
            );

            expect(response.status).toBe(404);
        });
    });
});
