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
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrismaInstance),
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

    test('getProject returns a single project with its columns', async () => {
        const project = { id: 'p1', name: 'Projet' };
        mockPrismaInstance.project.findUnique.mockResolvedValue(project);

        const result = await db.getProject('p1');

        expect(mockPrismaInstance.project.findUnique).toHaveBeenCalledWith({
            where: { id: 'p1' },
            include: { columns: { orderBy: { order: 'asc' } } },
        });
        expect(result).toEqual(project);
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
          prisma.project.findFirst.mockResolvedValue({ id: 'project-1' });
      
          const result = await db.userCanEditProject('user-1', 'project-1');
      
          expect(result).toBe(true);
        });
      
        it('returns true when the user is an accepted editor', async () => {
          prisma.project.findFirst.mockResolvedValue({ id: 'project-1' });
      
          const result = await db.userCanEditProject('user-2', 'project-1');
      
          expect(result).toBe(true);
        });
      
        it('returns false when the user is only a viewer', async () => {
          prisma.project.findFirst.mockResolvedValue(null);
      
          const result = await db.userCanEditProject('user-2', 'project-1');
      
          expect(result).toBe(false);
        });
      
        it('returns false when the editor invitation is pending', async () => {
          prisma.project.findFirst.mockResolvedValue(null);
      
          const result = await db.userCanEditProject('user-2', 'project-1');
      
          expect(result).toBe(false);
        });
      
        it('returns false when the user has no access to the project', async () => {
          prisma.project.findFirst.mockResolvedValue(null);
      
          const result = await db.userCanEditProject('user-2', 'project-1');
      
          expect(result).toBe(false);
        });
      
        it('returns false when userId is missing', async () => {
          const result = await db.userCanEditProject(null, 'project-1');
      
          expect(result).toBe(false);
          expect(prisma.project.findFirst).not.toHaveBeenCalled();
        });
      
        it('returns false when projectId is missing', async () => {
          const result = await db.userCanEditProject('user-1', null);
      
          expect(result).toBe(false);
          expect(prisma.project.findFirst).not.toHaveBeenCalled();
        });
      });

    test('userCanAccessProject matches the project on its owner', async () => {
        mockPrismaInstance.project.findFirst.mockResolvedValue({ id: 'p1' });

        await expect(db.userCanAccessProject('u1', 'p1')).resolves.toBe(true);
        expect(mockPrismaInstance.project.findFirst).toHaveBeenCalledWith({
            where: { id: 'p1', ownerId: 'u1' },
            select: { id: true },
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
});
