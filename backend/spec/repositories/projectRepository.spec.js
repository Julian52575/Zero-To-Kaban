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
                'project-id'
            );

            expect(db.getProject).toHaveBeenCalledWith(
                'project-id'
            );

            expect(result).toEqual(project);
        });

        it('should return null when project does not exist', async () => {
            db.getProject.mockResolvedValue(null);

            const result = await projectRepository.getById(
                'unknown-id'
            );

            expect(db.getProject).toHaveBeenCalledWith(
                'unknown-id'
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
});
