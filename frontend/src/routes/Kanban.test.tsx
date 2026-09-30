import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Kanban from './Kanban';

vi.mock('../components/TodoList', () => ({
    default: ({ projectId }: { projectId: string }) => <div>todo:{projectId}</div>,
}));
vi.mock('../components/BackButton', () => ({ default: () => null }));
vi.mock('../components/NotificationCenter', () => ({ default: () => null }));
vi.mock('../components/UserProfile/UserProfileButton', () => ({ default: () => null }));

function renderAt(path: string, routePath: string) {
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={routePath} element={<Kanban />} />
                <Route path="/" element={<p>home</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('Kanban', () => {
    test('renders the todo list for the project in the URL', () => {
        renderAt('/projects/42', '/projects/:projectId');

        expect(screen.getByText('todo:42')).toBeInTheDocument();
    });

    test('redirects home when there is no project id', () => {
        renderAt('/kanban', '/kanban');

        expect(screen.getByText('home')).toBeInTheDocument();
    });
});
