jest.mock('../../src/persistence');

const db = require('../../src/persistence');
const projectRepository = require('../../src/repositories/projectRepository');

describe('projectRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a project', async () => {
            const project = {
                id: 'project-id',
                name: 'Mon projet',
            };

            db.createProject.mockResolvedValue(project);

            const result = await projectRepository.create(project);

            expect(db.createProject).toHaveBeenCalledWith(project);
            expect(result).toEqual(project);
        });
    });

    describe('getAll', () => {
        it('should return all projects', async () => {
            const projects = [
                {
                    id: '1',
                    name: 'Projet 1',
                },
                {
                    id: '2',
                    name: 'Projet 2',
                },
            ];

            db.getProjects.mockResolvedValue(projects);

            const result = await projectRepository.getAll('user-id');

            expect(db.getProjects).toHaveBeenCalledWith('user-id');
            expect(result).toEqual(projects);
        });
    });

    describe('getById', () => {
        it('should return a project by its id', async () => {
            const project = {
                id: 'project-id',
                name: 'Mon projet',
            };

            db.getProject.mockResolvedValue(project);

            const result = await projectRepository.getById(
                'project-id',
                'owner-id'
            );

            expect(db.getProject).toHaveBeenCalledWith(
                'project-id',
                'owner-id'
            );

            expect(result).toEqual(project);
        });

        it('should return null when project does not exist', async () => {
            db.getProject.mockResolvedValue(null);

            const result = await projectRepository.getById(
                'unknown-id',
                'owner-id'
            );

            expect(db.getProject).toHaveBeenCalledWith(
                'unknown-id',
                'owner-id'
            );

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update a project', async () => {
            const project = {
                id: 'project-id',
                name: 'Nouveau nom',
            };

            db.updateProject.mockResolvedValue(project);

            const result = await projectRepository.update('project-id', {
                name: 'Nouveau nom',
            });

            expect(db.updateProject).toHaveBeenCalledWith('project-id', {
                name: 'Nouveau nom',
            });
            expect(result).toEqual(project);
        });
    });

    describe('deleteProject', () => {
        it('should delete a project by its id', async () => {
            db.deleteProject.mockResolvedValue();

            await projectRepository.deleteProject('project-id');

            expect(db.deleteProject).toHaveBeenCalledWith(
                'project-id'
            );
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

            db.getProjectCollaborators.mockResolvedValue(collaborators);

            const result = await projectRepository.getProjectCollaborators('p1');

            expect(db.getProjectCollaborators).toHaveBeenCalledWith('p1');
            expect(result).toEqual(collaborators);
        });
    });

    describe('passthrough to persistence', () => {
        it.each([
            ['createProjectCollaborator', 'createProjectCollaborator', [{ projectId: 'p1' }]],
            ['getAllFromUser', 'getProjectsFromUser', ['u1']],
            ['updateProjectCollaborator', 'updateProjectCollaborator', ['p1', 'u1', { role: 'EDITOR' }]],
            ['getProjectCollaborator', 'getProjectCollaborator', ['p1', 'u1']],
            ['getColumnsByProject', 'getColumns', ['p1']],
            ['userCanAccessProject', 'userCanAccessProject', ['u1', 'p1']],
        ])('%s delegates to db.%s', async (method, dbMethod, args) => {
            db[dbMethod].mockResolvedValue('result');

            const result = await projectRepository[method](...args);

            expect(db[dbMethod]).toHaveBeenCalledWith(...args);
            expect(result).toBe('result');
        });
    });
});
