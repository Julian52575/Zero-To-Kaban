const mockPrismaInstance = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    todoItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    project: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    projectCollaborator: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    task: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    column: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrismaInstance),
    $Enums: {
        CollaboratorRole: { EDITOR: 'EDITOR', VIEWER: 'VIEWER' },
        CollaboratorInvitationState: { ACCEPTED: 'ACCEPTED', PENDING: 'PENDING' },
        TaskPriority: { MEDIUM: 'MEDIUM' },
    },
}));

const db = require('../../src/persistence');

describe('persistence', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('init connects to the database', async () => {
        mockPrismaInstance.$connect.mockResolvedValue();
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await db.init();

        expect(mockPrismaInstance.$connect).toHaveBeenCalledTimes(1);
        logSpy.mockRestore();
    });

    test('teardown disconnects from the database', async () => {
        mockPrismaInstance.$disconnect.mockResolvedValue();

        await db.teardown();

        expect(mockPrismaInstance.$disconnect).toHaveBeenCalledTimes(1);
    });

    test('getItems returns every todo item', async () => {
        const items = [{ id: '1', name: 'Task 1', completed: false }];
        mockPrismaInstance.todoItem.findMany.mockResolvedValue(items);

        const result = await db.getItems();

        expect(mockPrismaInstance.todoItem.findMany).toHaveBeenCalledTimes(1);
        expect(result).toEqual(items);
    });

    test('getItem returns a single todo item by id', async () => {
        const item = { id: '1', name: 'Task 1', completed: false };
        mockPrismaInstance.todoItem.findUnique.mockResolvedValue(item);

        const result = await db.getItem('1');

        expect(mockPrismaInstance.todoItem.findUnique).toHaveBeenCalledWith({
            where: { id: '1' },
        });
        expect(result).toEqual(item);
    });

    test('storeItem creates a todo item with the given fields', async () => {
        const item = { id: '1', name: 'Task 1', completed: false };
        mockPrismaInstance.todoItem.create.mockResolvedValue(item);

        const result = await db.storeItem(item);

        expect(mockPrismaInstance.todoItem.create).toHaveBeenCalledWith({
            data: { id: '1', name: 'Task 1', completed: false },
        });
        expect(result).toEqual(item);
    });

    test('updateItem updates the name and completed fields by id', async () => {
        mockPrismaInstance.todoItem.update.mockResolvedValue();

        await db.updateItem('1', { name: 'Updated', completed: true });

        expect(mockPrismaInstance.todoItem.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: { name: 'Updated', completed: true },
        });
    });

    test('removeItem deletes a todo item by id', async () => {
        mockPrismaInstance.todoItem.delete.mockResolvedValue();

        await db.removeItem('1');

        expect(mockPrismaInstance.todoItem.delete).toHaveBeenCalledWith({
            where: { id: '1' },
        });
    });

    test('createProject creates a project with its default columns', async () => {
        const project = { id: 'p1', name: 'Projet', ownerId: 'u1' };
        mockPrismaInstance.project.create.mockResolvedValue(project);

        const result = await db.createProject(project);

        expect(mockPrismaInstance.project.create).toHaveBeenCalledWith({
            data: {
                id: 'p1',
                name: 'Projet',
                ownerId: 'u1',
                columns: {
                    create: [
                        { name: 'À faire', order: 0 },
                        { name: 'En cours', order: 1 },
                        { name: 'Terminé', order: 2 },
                    ],
                },
            },
            include: { columns: { orderBy: { order: 'asc' } } },
        });
        expect(result).toEqual(project);
    });

    test("getProjects returns the user's projects", async () => {
        const projects = [{ id: 'p1', name: 'Projet' }];
        mockPrismaInstance.project.findMany.mockResolvedValue(projects);

        const result = await db.getProjects('u1');

        expect(mockPrismaInstance.project.findMany).toHaveBeenCalledWith({
            where: { ownerId: 'u1' },
            orderBy: { createdAt: 'desc' },
        });
        expect(result).toEqual(projects);
    });

    test('getProjects refuses to list without a user', async () => {
        await expect(db.getProjects()).rejects.toThrow(
            'getProjects: userId is required'
        );
        expect(mockPrismaInstance.project.findMany).not.toHaveBeenCalled();
    });

    test('updateProject updates the name of a project by id', async () => {
        const project = { id: 'p1', name: 'Nouveau nom' };
        mockPrismaInstance.project.update.mockResolvedValue(project);

        const result = await db.updateProject('p1', { name: 'Nouveau nom' });

        expect(mockPrismaInstance.project.update).toHaveBeenCalledWith({
            where: { id: 'p1' },
            data: { name: 'Nouveau nom' },
            include: { columns: { orderBy: { order: 'asc' } } },
        });
        expect(result).toEqual(project);
    });

    test('deleteProject deletes a project by id', async () => {
        mockPrismaInstance.project.delete.mockResolvedValue();

        await db.deleteProject('p1');

        expect(mockPrismaInstance.project.delete).toHaveBeenCalledWith({
            where: { id: 'p1' },
        });
    });

    describe('userCanEditProject', () => {
        it('returns true when the user is the project owner', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue({
                id: 'project-1',
            });

            const result = await db.userCanEditProject('user-1', 'project-1');

            expect(result).toBe(true);
        });

        it('returns true when the user is an accepted editor', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue({
                id: 'project-1',
            });

            const result = await db.userCanEditProject('user-2', 'project-1');

            expect(result).toBe(true);
        });

        it('returns false when the user is only a viewer', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue(null);

            const result = await db.userCanEditProject('user-2', 'project-1');

            expect(result).toBe(false);
        });

        it('returns false when the editor invitation is pending', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue(null);

            const result = await db.userCanEditProject('user-2', 'project-1');

            expect(result).toBe(false);
        });

        it('returns false when the user has no access to the project', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue(null);

            const result = await db.userCanEditProject('user-2', 'project-1');

            expect(result).toBe(false);
        });

        it('returns false when userId is missing', async () => {
            const result = await db.userCanEditProject(null, 'project-1');

            expect(result).toBe(false);

            expect(
                mockPrismaInstance.project.findFirst
            ).not.toHaveBeenCalled();
        });

        it('returns false when projectId is missing', async () => {
            const result = await db.userCanEditProject('user-1', null);

            expect(result).toBe(false);

            expect(
                mockPrismaInstance.project.findFirst
            ).not.toHaveBeenCalled();
        });
    });

    test.each([
        ['u1', undefined],
        [undefined, 'p1'],
    ])(
        'userCanAccessProject(%s, %s) denies without querying',
        async (userId, projectId) => {
            // Prisma would drop the undefined filter and match any project.
            await expect(
                db.userCanAccessProject(userId, projectId)
            ).resolves.toBe(false);
            expect(mockPrismaInstance.project.findFirst).not.toHaveBeenCalled();
        }
    );

    describe('project queries', () => {
        const withCollab = (over = {}) => ({
            id: 'p1',
            ownerId: 'owner',
            columns: [],
            collaborators: [],
            ...over,
        });

        test('getProject returns the project with permissions for its owner', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue(withCollab());

            const result = await db.getProject('p1', 'owner');

            expect(mockPrismaInstance.project.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ id: 'p1' }),
                    include: expect.objectContaining({
                        columns: { orderBy: { order: 'asc' } },
                    }),
                })
            );
            expect(result).toEqual({
                id: 'p1',
                ownerId: 'owner',
                columns: [],
                role: 'OWNER',
                isOwner: true,
                canEdit: true,
                canManage: true,
            });
        });

        test('getProject gives an accepted editor edit but not manage rights', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue(
                withCollab({ collaborators: [{ role: 'EDITOR' }] })
            );

            const result = await db.getProject('p1', 'u2');

            expect(result).toMatchObject({
                role: 'EDITOR',
                isOwner: false,
                canEdit: true,
                canManage: false,
            });
        });

        test('getProject gives a viewer read-only rights', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue(
                withCollab({ collaborators: [{ role: 'VIEWER' }] })
            );

            const result = await db.getProject('p1', 'u3');

            expect(result).toMatchObject({ role: 'VIEWER', canEdit: false, canManage: false });
        });

        test('getProject tolerates a project without a collaborators list', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue({ id: 'p1', ownerId: 'x' });

            const result = await db.getProject('p1', 'u9');

            expect(result).toMatchObject({ role: undefined, canEdit: false });
        });

        test('getProject returns null for a project the user cannot see', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue(null);

            await expect(db.getProject('p1', 'intruder')).resolves.toBeNull();
        });

        test('getProjectsFromUser returns the owned and joined projects with permissions', async () => {
            mockPrismaInstance.project.findMany.mockResolvedValue([
                withCollab({ id: 'p1', ownerId: 'u1' }),
                withCollab({ id: 'p2', collaborators: [{ role: 'EDITOR' }] }),
            ]);

            const result = await db.getProjectsFromUser('u1');

            expect(result.map((p) => [p.id, p.role])).toEqual([
                ['p1', 'OWNER'],
                ['p2', 'EDITOR'],
            ]);
        });

        test('getProjectsFromUser refuses to list without a user', async () => {
            await expect(db.getProjectsFromUser()).rejects.toThrow(
                'getProjectsFromUser: userId is required'
            );
        });
    });

    describe('getProjectCollaborators', () => {
        const collaborators = [
            { userId: 'u2', role: 'EDITOR', state: 'ACCEPTED' },
            { userId: 'u3', role: 'VIEWER', state: 'ACCEPTED' },
        ];

        beforeEach(() => {
            global.fetch = jest.fn();
            process.env.AUTH_SERVICE_URL = 'http://auth.test:4000';
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            delete global.fetch;
            delete process.env.AUTH_SERVICE_URL;
            console.error.mockRestore();
        });

        test('requires a project id', async () => {
            await expect(db.getProjectCollaborators()).rejects.toThrow(
                'getProjectCollaborators: projectId is required'
            );
        });

        test.each([
            ['the project does not exist', null],
            ['the project has no collaborators list', {}],
            ['the project has no collaborators', { collaborators: [] }],
        ])('returns an empty list when %s', async (_name, project) => {
            mockPrismaInstance.project.findUnique.mockResolvedValue(project);

            await expect(db.getProjectCollaborators('p1')).resolves.toEqual([]);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        test('resolves the collaborators through the auth service', async () => {
            const users = [{ id: 'u2', pseudo: 'Bob' }];
            mockPrismaInstance.project.findUnique.mockResolvedValue({ collaborators });
            global.fetch.mockResolvedValue({ ok: true, json: async () => users });

            const result = await db.getProjectCollaborators('p1');

            expect(global.fetch).toHaveBeenCalledWith(
                'http://auth.test:4000/internal/users/lookup',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ ids: ['u2', 'u3'] }),
                })
            );
            expect(result).toEqual(users);
        });

        test('returns an empty list when the auth service answers with an error', async () => {
            mockPrismaInstance.project.findUnique.mockResolvedValue({ collaborators });
            global.fetch.mockResolvedValue({ ok: false, status: 500 });

            await expect(db.getProjectCollaborators('p1')).resolves.toEqual([]);
            expect(console.error).toHaveBeenCalled();
        });

        test('returns an empty list when the auth service URL is not configured', async () => {
            delete process.env.AUTH_SERVICE_URL;
            mockPrismaInstance.project.findUnique.mockResolvedValue({ collaborators });

            await expect(db.getProjectCollaborators('p1')).resolves.toEqual([]);
            expect(global.fetch).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalled();
        });

        test('returns an empty list when the auth service is unreachable', async () => {
            mockPrismaInstance.project.findUnique.mockResolvedValue({ collaborators });
            global.fetch.mockRejectedValue(new Error('ECONNREFUSED'));

            await expect(db.getProjectCollaborators('p1')).resolves.toEqual([]);
        });
    });

    describe('project collaborators', () => {
        test('createProjectCollaborator stores the invitation', async () => {
            const collaborator = { projectId: 'p1', userId: 'u2', role: 'VIEWER', state: 'PENDING' };
            mockPrismaInstance.projectCollaborator.create.mockResolvedValue(collaborator);

            const result = await db.createProjectCollaborator(collaborator);

            expect(mockPrismaInstance.projectCollaborator.create).toHaveBeenCalledWith({
                data: collaborator,
            });
            expect(result).toEqual(collaborator);
        });

        test('getProjectCollaborator finds one collaborator', async () => {
            mockPrismaInstance.projectCollaborator.findFirst.mockResolvedValue({ id: 'c1' });

            await expect(db.getProjectCollaborator('p1', 'u2')).resolves.toEqual({ id: 'c1' });
            expect(mockPrismaInstance.projectCollaborator.findFirst).toHaveBeenCalledWith({
                where: { projectId: 'p1', userId: 'u2' },
            });
        });

        test('updateProjectCollaborator updates the role and state', async () => {
            mockPrismaInstance.projectCollaborator.findFirst.mockResolvedValue({ id: 'c1' });
            mockPrismaInstance.projectCollaborator.update.mockResolvedValue({ id: 'c1' });

            await db.updateProjectCollaborator('p1', 'u2', { role: 'EDITOR', state: 'ACCEPTED' });

            expect(mockPrismaInstance.projectCollaborator.update).toHaveBeenCalledWith({
                where: { id: 'c1' },
                data: { role: 'EDITOR', state: 'ACCEPTED' },
            });
        });

        test('updateProjectCollaborator only sends the given fields', async () => {
            mockPrismaInstance.projectCollaborator.findFirst.mockResolvedValue({ id: 'c1' });

            await db.updateProjectCollaborator('p1', 'u2', {});

            expect(mockPrismaInstance.projectCollaborator.update).toHaveBeenCalledWith({
                where: { id: 'c1' },
                data: {},
            });
        });

        test('updateProjectCollaborator returns null for an unknown collaborator', async () => {
            mockPrismaInstance.projectCollaborator.findFirst.mockResolvedValue(null);

            await expect(db.updateProjectCollaborator('p1', 'u2', {})).resolves.toBeNull();
            expect(mockPrismaInstance.projectCollaborator.update).not.toHaveBeenCalled();
        });
    });

    describe('updateDeletedProjectCollaborator', () => {
        test('returns null when the project does not exist', async () => {
            mockPrismaInstance.project.findUnique.mockResolvedValue(null);

            await expect(db.updateDeletedProjectCollaborator('p1', 'u1', 'anon')).resolves.toBeNull();
            expect(mockPrismaInstance.project.update).not.toHaveBeenCalled();
        });

        test('reassigns ownership when the deleted user owned the project', async () => {
            mockPrismaInstance.project.findUnique.mockResolvedValue({ ownerId: 'u1' });
            mockPrismaInstance.project.update.mockResolvedValue({ id: 'p1' });

            await db.updateDeletedProjectCollaborator('p1', 'u1', 'anon');

            expect(mockPrismaInstance.project.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        ownerId: 'anon',
                        collaborators: {
                            updateMany: { where: { userId: 'u1' }, data: { userId: 'anon' } },
                        },
                    },
                })
            );
        });

        test('keeps the owner when the deleted user was only a collaborator', async () => {
            mockPrismaInstance.project.findUnique.mockResolvedValue({ ownerId: 'someone' });
            mockPrismaInstance.project.update.mockResolvedValue({ id: 'p1' });

            await db.updateDeletedProjectCollaborator('p1', 'u1', 'anon');

            const { data } = mockPrismaInstance.project.update.mock.calls[0][0];
            expect(data).not.toHaveProperty('ownerId');
            expect(data.collaborators.updateMany.data).toEqual({ userId: 'anon' });
        });
    });

    describe('columns and tasks', () => {
        test('columnBelongsToProject checks the column in the project', async () => {
            mockPrismaInstance.column.findFirst.mockResolvedValue({ id: 'c1' });

            await expect(db.columnBelongsToProject('c1', 'p1')).resolves.toBe(true);
            expect(mockPrismaInstance.column.findFirst).toHaveBeenCalledWith({
                where: { id: 'c1', projectId: 'p1' },
                select: { id: true },
            });
        });

        test('columnBelongsToProject is false for a foreign column', async () => {
            mockPrismaInstance.column.findFirst.mockResolvedValue(null);

            await expect(db.columnBelongsToProject('c1', 'p2')).resolves.toBe(false);
        });

        test.each([
            [undefined, 'p1'],
            ['c1', undefined],
        ])('columnBelongsToProject(%s, %s) denies without querying', async (c, p) => {
            await expect(db.columnBelongsToProject(c, p)).resolves.toBe(false);
            expect(mockPrismaInstance.column.findFirst).not.toHaveBeenCalled();
        });

        test('getColumns lists the project columns in order', async () => {
            mockPrismaInstance.column.findMany.mockResolvedValue([{ id: 'c1' }]);

            await expect(db.getColumns('p1')).resolves.toEqual([{ id: 'c1' }]);
            expect(mockPrismaInstance.column.findMany).toHaveBeenCalledWith({
                where: { projectId: 'p1' },
                orderBy: { order: 'asc' },
            });
        });

        test('getTasks lists the tasks of the project', async () => {
            mockPrismaInstance.task.findMany.mockResolvedValue([{ id: 't1' }]);

            await expect(db.getTasks('p1')).resolves.toEqual([{ id: 't1' }]);
            expect(mockPrismaInstance.task.findMany).toHaveBeenCalledWith({
                where: { column: { projectId: 'p1' } },
                orderBy: [{ columnId: 'asc' }, { order: 'asc' }],
            });
        });

        test('getTask includes the column', async () => {
            mockPrismaInstance.task.findUnique.mockResolvedValue({ id: 't1' });

            await db.getTask('t1');

            expect(mockPrismaInstance.task.findUnique).toHaveBeenCalledWith({
                where: { id: 't1' },
                include: { column: true },
            });
        });

        test('storeTask appends the task at the end of the column', async () => {
            mockPrismaInstance.task.count.mockResolvedValue(3);
            mockPrismaInstance.task.create.mockResolvedValue({ id: 't1' });

            await db.storeTask('c1', 'u1', { title: 'T', description: 'D', assigneeId: 'u2', dueDate: 'd' });

            expect(mockPrismaInstance.task.create).toHaveBeenCalledWith({
                data: {
                    title: 'T',
                    description: 'D',
                    order: 3,
                    columnId: 'c1',
                    creatorId: 'u1',
                    assigneeId: 'u2',
                    dueDate: 'd',
                    priority: 'MEDIUM',
                },
            });
        });

        test('storeTask defaults the assignee and due date to null', async () => {
            mockPrismaInstance.task.count.mockResolvedValue(0);

            await db.storeTask('c1', 'u1', { title: 'T' });

            expect(mockPrismaInstance.task.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ assigneeId: null, dueDate: null, order: 0 }),
            });
        });

        test('updateTask forwards every editable field', async () => {
            const data = {
                title: 'T',
                description: 'D',
                order: 1,
                columnId: 'c2',
                assigneeId: 'u2',
                dueDate: 'd',
                priority: 'HIGH',
            };

            await db.updateTask('t1', data);

            expect(mockPrismaInstance.task.update).toHaveBeenCalledWith({
                where: { id: 't1' },
                data,
            });
        });

        test('deleteTask deletes by id', async () => {
            await db.deleteTask('t1');

            expect(mockPrismaInstance.task.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
        });
    });

    describe('project access', () => {
        test('userCanAccessProject allows owners and accepted collaborators', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue({ id: 'p1' });

            await expect(db.userCanAccessProject('u1', 'p1')).resolves.toBe(true);
        });

        test('userCanAccessProject denies everyone else', async () => {
            mockPrismaInstance.project.findFirst.mockResolvedValue(null);

            await expect(db.userCanAccessProject('u1', 'p1')).resolves.toBe(false);
        });
    });
});
