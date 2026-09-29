import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Projects from './Projects';
import { getProjects, createProject, deleteProject } from '../services/ProjectApi';

vi.mock('../services/ProjectApi', () => ({
    getProjects: vi.fn(),
    createProject: vi.fn(),
    deleteProject: vi.fn(),
}));

const projects = [
    { id: '1', name: 'Alpha' },
    { id: '2', name: 'Beta' },
];

function renderProjects() {
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<Projects />} />
                <Route path="/projects/:id" element={<p>Project page</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('Projects', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('lists the fetched projects', async () => {
        vi.mocked(getProjects).mockResolvedValue(projects);
        renderProjects();

        expect(await screen.findByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    test('shows an empty state when there are no projects', async () => {
        vi.mocked(getProjects).mockResolvedValue([]);
        renderProjects();

        expect(await screen.findByText('No projects at the moment.')).toBeInTheDocument();
    });

    test('shows an error when fetching fails', async () => {
        vi.mocked(getProjects).mockRejectedValue(new Error('down'));
        renderProjects();

        expect(
            await screen.findByText('Impossible de récupérer les projets. Veuillez réessayer plus tard.'),
        ).toBeInTheDocument();
    });

    test('creates a project and clears the input', async () => {
        vi.mocked(getProjects).mockResolvedValue([]);
        vi.mocked(createProject).mockResolvedValue({ id: '3', name: 'Gamma' });
        renderProjects();

        const input = screen.getByPlaceholderText('Name of the new project');
        await userEvent.type(input, '  Gamma  ');
        await userEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(createProject).toHaveBeenCalledWith('Gamma');
        expect(await screen.findByText('Gamma')).toBeInTheDocument();
        expect(input).toHaveValue('');
    });

    test('ignores a blank project name', async () => {
        vi.mocked(getProjects).mockResolvedValue([]);
        renderProjects();

        await userEvent.type(screen.getByPlaceholderText('Name of the new project'), '   ');
        await userEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(createProject).not.toHaveBeenCalled();
    });

    test('shows an error when creating fails', async () => {
        vi.mocked(getProjects).mockResolvedValue([]);
        vi.mocked(createProject).mockRejectedValue(new Error('down'));
        renderProjects();

        await userEvent.type(screen.getByPlaceholderText('Name of the new project'), 'Gamma');
        await userEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(
            await screen.findByText('Impossible de Create le projet. Veuillez réessayer plus tard.'),
        ).toBeInTheDocument();
    });

    test('deletes a project after confirmation', async () => {
        vi.mocked(getProjects).mockResolvedValue(projects);
        vi.mocked(deleteProject).mockResolvedValue(undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        renderProjects();

        await screen.findByText('Alpha');
        await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

        expect(deleteProject).toHaveBeenCalledWith('1');
        await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument());
        expect(screen.getByText('Beta')).toBeInTheDocument();
        // stopPropagation keeps the row click from navigating away
        expect(screen.queryByText('Project page')).not.toBeInTheDocument();
    });

    test('keeps the project when deletion is not confirmed', async () => {
        vi.mocked(getProjects).mockResolvedValue(projects);
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        renderProjects();

        await screen.findByText('Alpha');
        await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

        expect(deleteProject).not.toHaveBeenCalled();
        expect(screen.getByText('Alpha')).toBeInTheDocument();
    });

    test('shows an error when deleting fails', async () => {
        vi.mocked(getProjects).mockResolvedValue(projects);
        vi.mocked(deleteProject).mockRejectedValue(new Error('down'));
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        renderProjects();

        await screen.findByText('Alpha');
        await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

        expect(
            await screen.findByText('Impossible de Delete le projet. Veuillez réessayer plus tard.'),
        ).toBeInTheDocument();
    });

    test('navigates to the project page when a row is clicked', async () => {
        vi.mocked(getProjects).mockResolvedValue(projects);
        renderProjects();

        await userEvent.click(await screen.findByText('Alpha'));

        expect(await screen.findByText('Project page')).toBeInTheDocument();
    });
});
