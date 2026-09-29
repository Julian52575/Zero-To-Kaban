jest.mock('../../src/repositories/taskRepository', () => ({
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
}));

jest.mock('../../src/persistence', () => ({
    userCanAccessProject: jest.fn(),
    userCanEditProject: jest.fn(),
}));

const taskRepository = require('../../src/repositories/taskRepository');
const { userCanAccessProject, userCanEditProject } = require('../../src/persistence');
const taskService = require('../../src/services/taskService');

describe('taskService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getTasks delegates to taskRepository.getAll', async () => {
        const tasks = [{ id: '1', title: 'Task 1' }];
        taskRepository.getAll.mockResolvedValue(tasks);

        const result = await taskService.getTasks('p1');

        expect(taskRepository.getAll).toHaveBeenCalledWith('p1');
        expect(result).toEqual(tasks);
    });

    test('getTask delegates to taskRepository.getById', async () => {
        const task = { id: '1', title: 'Task 1' };
        taskRepository.getById.mockResolvedValue(task);

        const result = await taskService.getTask('1');

        expect(taskRepository.getById).toHaveBeenCalledWith('1');
        expect(result).toEqual(task);
    });

    test('createTask delegates to taskRepository.create', async () => {
        const data = { title: 'New task' };
        const created = { id: '1', ...data };
        taskRepository.create.mockResolvedValue(created);

        const result = await taskService.createTask('c1', 'u1', data);

        expect(taskRepository.create).toHaveBeenCalledWith('c1', 'u1', data);
        expect(result).toEqual(created);
    });

    test('updateTask saves the change and returns the stored task', async () => {
        const data = { title: 'Updated' };
        const stored = { id: '1', ...data };
        taskRepository.update.mockResolvedValue(stored);

        const result = await taskService.updateTask('1', data);

        expect(taskRepository.update).toHaveBeenCalledWith('1', data);
        expect(result).toEqual(stored);
    });

    describe('deleteTask', () => {
        const task = { id: '1', columnId: 'c1', column: { projectId: 'p1' } };

        test('deletes a task of a project the user owns', async () => {
            taskRepository.getById.mockResolvedValue(task);
            userCanAccessProject.mockResolvedValue(true);
            userCanEditProject.mockResolvedValue(true);
            taskRepository.deleteById.mockResolvedValue(task);

            const result = await taskService.deleteTask('1', 'u1');

            expect(userCanAccessProject).toHaveBeenCalledWith('u1', 'p1');
            expect(taskRepository.deleteById).toHaveBeenCalledWith('1');
            expect(result).toEqual(task);
        });

        test('returns null when the task does not exist', async () => {
            taskRepository.getById.mockResolvedValue(null);

            const result = await taskService.deleteTask('1', 'u1');

            expect(result).toBeNull();
            expect(taskRepository.deleteById).not.toHaveBeenCalled();
        });

        test("returns false for a task of someone else's project", async () => {
            taskRepository.getById.mockResolvedValue(task);
            userCanAccessProject.mockResolvedValue(false);

            const result = await taskService.deleteTask('1', 'intruder');

            expect(result).toBe(false);
            expect(taskRepository.deleteById).not.toHaveBeenCalled();
        });
    });
});
