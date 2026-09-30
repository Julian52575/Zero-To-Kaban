import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./routes/Projects', () => ({
    default: () => <div>projects-stub</div>,
}));

vi.mock('./components/NotificationCenter', () => ({ default: () => null }));
vi.mock('./components/UserProfile/UserProfileButton', () => ({ default: () => null }));

vi.mock('./components/TodoList', () => ({
    default: ({ projectId }: { projectId: string }) => (
        <div>todo-list-stub:{projectId}</div>
    ),
}));

vi.mock('./provider/useNotificationsProvider', () => ({
    NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useNotifications: () => ({ unreadNotifications: [], markAllTaskAsRead: vi.fn(), resolveNotification: vi.fn() }),
}));

import App from './App';

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>,
    );
}

describe('App', () => {
    test('renders the project list at the root', () => {
        renderAt('/');

        expect(screen.getByText('projects-stub')).toBeInTheDocument();
    });

    test('renders the kanban board for a project', () => {
        renderAt('/projects/42');

        expect(screen.getByText('todo-list-stub:42')).toBeInTheDocument();
    });

    test('redirects unknown routes to the project list', () => {
        renderAt('/does/not/exist');

        expect(screen.getByText('projects-stub')).toBeInTheDocument();
    });
});
