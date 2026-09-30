jest.mock('../../src/repositories/projectRepository');
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(),
    $Enums: {
        CollaboratorRole: { VIEWER: 'VIEWER' },
        CollaboratorInvitationState: { PENDING: 'PENDING' },
    },
}));

const projectRepository = require('../../src/repositories/projectRepository');
const projectService = require('../../src/services/projectService');

describe('projectService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createProject', () => {
        it('should create a project with an id and a trimmed name', async () => {
            const createdProject = {
                id: 'project-id',
                name: 'Mon projet',
            };

            projectRepository.create.mockResolvedValue(createdProject);

            const result = await projectService.createProject({
                name: '  Mon projet  ',
                ownerId: 'owner-id',
            });

            expect(projectRepository.create).toHaveBeenCalledTimes(1);

            const projectPassedToRepository =
                projectRepository.create.mock.calls[0][0];

            expect(projectPassedToRepository).toHaveProperty('id');
            expect(typeof projectPassedToRepository.id).toBe('string');

            expect(projectPassedToRepository.name).toBe(
                'Mon projet'
            );
            expect(projectPassedToRepository.ownerId).toBe('owner-id');

            expect(result).toEqual(createdProject);
        });
    });

    describe('getProjects', () => {
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

            projectRepository.getAll.mockResolvedValue(projects);

            const result = await projectService.getProjects('owner-id');

            expect(projectRepository.getAll).toHaveBeenCalledWith('owner-id');
            expect(result).toEqual(projects);
        });
    });

    const project = {
        id: 'project-id',
        name: 'Mon projet',
        ownerId: 'owner-id',
    };

    describe('getProject', () => {
        it("should return the owner's project", async () => {
            projectRepository.getById.mockResolvedValue(project);

            const result = await projectService.getProject(
                'project-id',
                'owner-id'
            );

            expect(projectRepository.getById).toHaveBeenCalledWith(
                'project-id',
                'owner-id'
            );
            expect(result).toEqual(project);
        });

        it('should return null when the project does not exist', async () => {
            projectRepository.getById.mockResolvedValue(null);

            const result = await projectService.getProject(
                'unknown-id',
                'owner-id'
            );

            expect(result).toBeNull();
        });

        it("should return null for someone else's project", async () => {
            projectRepository.getById.mockResolvedValue(null);

            const result = await projectService.getProject(
                'project-id',
                'intruder-id'
            );

            expect(result).toBeNull();
        });
    });

    describe('updateProject', () => {
        it('should save a trimmed name and return both versions', async () => {
            const updatedProject = { ...project, name: 'Nouveau nom' };

            projectRepository.getById.mockResolvedValue(project);
            projectRepository.update.mockResolvedValue(updatedProject);

            const result = await projectService.updateProject(
                'project-id',
                'owner-id',
                { name: '  Nouveau nom  ' }
            );

            expect(projectRepository.update).toHaveBeenCalledWith(
                'project-id',
                { name: 'Nouveau nom' }
            );
            expect(result).toEqual({
                before: project,
                after: updatedProject,
            });
        });

        it('should return null when the project does not exist', async () => {
            projectRepository.getById.mockResolvedValue(null);

            const result = await projectService.updateProject(
                'unknown-id',
                'owner-id',
                { name: 'Nouveau nom' }
            );

            expect(result).toBeNull();
            expect(projectRepository.update).not.toHaveBeenCalled();
        });

        it("should not update someone else's project", async () => {
            projectRepository.getById.mockResolvedValue(null);

            const result = await projectService.updateProject(
                'project-id',
                'intruder-id',
                { name: 'Nouveau nom' }
            );

            expect(result).toBeNull();
            expect(projectRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('deleteProject', () => {
        it("should delete the owner's project", async () => {
            projectRepository.getById.mockResolvedValue(project);
            projectRepository.deleteProject.mockResolvedValue(project);

            const result = await projectService.deleteProject(
                'project-id',
                'owner-id'
            );

            expect(projectRepository.deleteProject).toHaveBeenCalledWith(
                'project-id'
            );
            expect(result).toEqual(project);
        });

        it('should return null when the project does not exist', async () => {
            projectRepository.getById.mockResolvedValue(null);

            const result = await projectService.deleteProject(
                'unknown-id',
                'owner-id'
            );

            expect(result).toBeNull();
            expect(projectRepository.deleteProject).not.toHaveBeenCalled();
        });

        it("should not delete someone else's project", async () => {
            projectRepository.getById.mockResolvedValue(null);

            const result = await projectService.deleteProject(
                'project-id',
                'intruder-id'
            );

            expect(result).toBeNull();
            expect(projectRepository.deleteProject).not.toHaveBeenCalled();
        });
    });
    describe('getUserProjects', () => {
        it('should return all projects belonging to the user', async () => {
            const projects = [
                {
                    id: 'project-1',
                    name: 'Projet 1',
                    ownerId: 'owner-id',
                },
                {
                    id: 'project-2',
                    name: 'Projet 2',
                    ownerId: 'owner-id',
                },
            ];

            projectRepository.getAllFromUser.mockResolvedValue(projects);

            const result = await projectService.getUserProjects('owner-id');

            expect(projectRepository.getAllFromUser).toHaveBeenCalledTimes(1);
            expect(projectRepository.getAllFromUser).toHaveBeenCalledWith(
                'owner-id'
            );

            expect(result).toEqual(projects);
        });

        it('should return an empty array when the user has no projects', async () => {
            projectRepository.getAllFromUser.mockResolvedValue([]);

            const result = await projectService.getUserProjects('owner-id');

            expect(projectRepository.getAllFromUser).toHaveBeenCalledWith(
                'owner-id'
            );

            expect(result).toEqual([]);
        });

        it('should propagate repository errors', async () => {
            const error = new Error('Database error');

            projectRepository.getAllFromUser.mockRejectedValue(error);

            await expect(
                projectService.getUserProjects('owner-id')
            ).rejects.toThrow('Database error');

            expect(projectRepository.getAllFromUser).toHaveBeenCalledWith(
                'owner-id'
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

            projectRepository.getProjectCollaborators.mockResolvedValue(
                collaborators
            );

            const result =
                await projectService.getProjectCollaborators('p1');

            expect(
                projectRepository.getProjectCollaborators
            ).toHaveBeenCalledWith('p1');

            expect(result).toEqual(collaborators);
        });
    });

    describe('createProjectCollaborator', () => {
        it('should invite the user as a pending viewer', async () => {
            projectRepository.createProjectCollaborator.mockResolvedValue('created');

            const result = await projectService.createProjectCollaborator('p1', 'u2');

            expect(projectRepository.createProjectCollaborator).toHaveBeenCalledWith({
                projectId: 'p1',
                userId: 'u2',
                role: 'VIEWER',
                state: 'PENDING',
            });
            expect(result).toBe('created');
        });
    });

    describe('updateProjectCollaborator', () => {
        it('should return both versions of the collaborator', async () => {
            projectRepository.getProjectCollaborator.mockResolvedValue({ role: 'VIEWER' });
            projectRepository.updateProjectCollaborator.mockResolvedValue({ role: 'EDITOR' });

            const result = await projectService.updateProjectCollaborator('p1', 'u2', {
                role: 'EDITOR',
            });

            expect(projectRepository.updateProjectCollaborator).toHaveBeenCalledWith(
                'p1',
                'u2',
                { role: 'EDITOR' }
            );
            expect(result).toEqual({
                before: { role: 'VIEWER' },
                after: { role: 'EDITOR' },
            });
        });

        it('should return null when the collaborator does not exist', async () => {
            projectRepository.getProjectCollaborator.mockResolvedValue(null);

            const result = await projectService.updateProjectCollaborator('p1', 'u2', {});

            expect(result).toBeNull();
            expect(projectRepository.updateProjectCollaborator).not.toHaveBeenCalled();
        });
    });

    describe('leaveProject', () => {
        it('should refuse to remove the owner', async () => {
            projectRepository.getProjectOwner.mockResolvedValue({ ownerId: 'u1' });

            const result = await projectService.leaveProject('p1', 'u1');

            expect(result).toBe('OWNER');
            expect(projectRepository.deleteProjectCollaborator).not.toHaveBeenCalled();
        });

        it('should remove a collaborator', async () => {
            projectRepository.getProjectOwner.mockResolvedValue({ ownerId: 'u1' });
            projectRepository.deleteProjectCollaborator.mockResolvedValue(true);

            const result = await projectService.leaveProject('p1', 'u2');

            expect(projectRepository.deleteProjectCollaborator).toHaveBeenCalledWith('p1', 'u2');
            expect(result).toBe('OK');
        });

        it('should report NOT_FOUND when the user is not a collaborator', async () => {
            projectRepository.getProjectOwner.mockResolvedValue({ ownerId: 'u1' });
            projectRepository.deleteProjectCollaborator.mockResolvedValue(false);

            await expect(projectService.leaveProject('p1', 'u2')).resolves.toBe('NOT_FOUND');
        });

        it('should report NOT_FOUND for an unknown project', async () => {
            projectRepository.getProjectOwner.mockResolvedValue(null);
            projectRepository.deleteProjectCollaborator.mockResolvedValue(false);

            await expect(projectService.leaveProject('nope', 'u2')).resolves.toBe('NOT_FOUND');
        });
    });
});
