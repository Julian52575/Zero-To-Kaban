import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoList from './TodoList';
import type { Task } from '../types/task';
import {
    getTasks,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
} from '../services/taskService';
import Swal from 'sweetalert2';
import { getProject, getProjectCollaborators, leaveProject } from '../services/ProjectApi';
import { ApiError } from '../services/apiClient';

vi.mock('../services/taskService', () => ({
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    moveTask: vi.fn(),
    deleteTask: vi.fn(),
}));

vi.mock('../services/ProjectApi', () => ({
    getProject: vi.fn(),
    getProjectCollaborators: vi.fn().mockResolvedValue([]),
    leaveProject: vi.fn(),
}));

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

vi.mock('./InviteCollaborator', () => ({
    default: ({ ownerId }: { ownerId: string }) => <div>invite:{ownerId}</div>,
}));

// Drag and drop can't be driven in jsdom, so the board is replaced by a stub
// exposing each callback as a button. KanbanBoard has its own render tests.
vi.mock('./KanbanBoard', () => ({
    default: ({
        items,
        onItemUpdate,
        onItemDelete,
        onStatusChange,
    }: {
        items: Task[];
        onItemUpdate: (item: Task, changes: Partial<Task>) => void;
        onItemDelete: (item: Task) => void;
        onStatusChange: (item: Task, status: 'todo' | 'doing' | 'done') => void;
    }) => (
        <ul>
            {items.map((item) => (
                <li key={item.id} aria-label={item.title}>
                    <span data-testid="status">{item.status}</span>
                    <button onClick={() => onItemUpdate(item, { title: `${item.title} (renamed)` })}>
                        rename
                    </button>
                    <button onClick={() => onItemDelete(item)}>delete</button>
                    <button onClick={() => onStatusChange(item, 'done')}>move to done</button>
                </li>
            ))}
        </ul>
    ),
}));

const columns = [
    { id: 'c-todo', name: 'To Do', order: 0, projectId: 'p1' },
    { id: 'c-doing', name: 'Doing', order: 1, projectId: 'p1' },
    { id: 'c-done', name: 'Done', order: 2, projectId: 'p1' },
];

const project = (cols = columns) => ({
    id: 'p1',
    name: 'Project',
    ownerId: 'u1',
    role: 'OWNER',
    isOwner: true,
    canEdit: true,
    canManage: false,
    columns: cols,
});

const tasks: Task[] = [
    { id: '1', title: 'Buy milk', order: 0, columnId: 'c-todo' },
    { id: '2', title: 'Walk dog', order: 0, columnId: 'c-done' },
];

const card = (name: string) => screen.getByRole('listitem', { name });
const statusOf = (name: string) => within(card(name)).getByTestId('status');

describe('TodoList', () => {
    beforeEach(() => {
        vi.mocked(getProject).mockResolvedValue(project());
        vi.mocked(getProjectCollaborators).mockResolvedValue([]);
        vi.mocked(getTasks).mockResolvedValue(tasks);
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    test('shows a loading message before tasks arrive', () => {
        vi.mocked(getTasks).mockReturnValue(new Promise(() => {}));

        render(<TodoList projectId="p1" />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('fetches columns and tasks for the project and maps them to items', async () => {
        render(<TodoList projectId="p1" />);

        expect(await screen.findByRole('listitem', { name: 'Buy milk' })).toBeInTheDocument();
        expect(getProject).toHaveBeenCalledWith('p1');
        expect(getTasks).toHaveBeenCalledWith('p1');
        expect(statusOf('Buy milk')).toHaveTextContent('todo');
        expect(statusOf('Walk dog')).toHaveTextContent('done');
    });

    test('a task in an unknown column falls back to "todo"', async () => {
        vi.mocked(getTasks).mockResolvedValue([
            { id: '3', title: 'Orphan', order: 0, columnId: 'gone' },
        ]);

        render(<TodoList projectId="p1" />);

        await screen.findByRole('listitem', { name: 'Orphan' });
        expect(statusOf('Orphan')).toHaveTextContent('todo');
    });

    test('shows an error message when loading fails', async () => {
        vi.mocked(getTasks).mockRejectedValue(new ApiError(404, 'HTTP error: 404'));

        render(<TodoList projectId="p1" />);

        expect(
            await screen.findByText('The requested resource was not found.'),
        ).toBeInTheDocument();
    });

    test('adding a task appends it to the board in the first column', async () => {
        const user = userEvent.setup();
        vi.mocked(createTask).mockResolvedValue({
            id: '9',
            title: 'New task',
            order: 1,
            columnId: 'c-todo',
        });

        render(<TodoList projectId="p1" />);
        await screen.findByRole('listitem', { name: 'Buy milk' });

        await user.type(screen.getByPlaceholderText('New Item'), 'New task');
        await user.click(screen.getByRole('button', { name: /add item/i }));

        expect(createTask).toHaveBeenCalledWith('p1', {
            title: 'New task',
            columnId: 'c-todo',
        });
        expect(await screen.findByRole('listitem', { name: 'New task' })).toBeInTheDocument();
    });

    test('renaming updates the task optimistically', async () => {
        const user = userEvent.setup();
        vi.mocked(updateTask).mockResolvedValue({ ...tasks[0], title: 'Buy milk (renamed)' });

        render(<TodoList projectId="p1" />);
        await screen.findByRole('listitem', { name: 'Buy milk' });

        await user.click(within(card('Buy milk')).getByRole('button', { name: 'rename' }));

        expect(updateTask).toHaveBeenCalledWith('p1', '1', { title: 'Buy milk (renamed)' });
        expect(card('Buy milk (renamed)')).toBeInTheDocument();
    });

    test('a failed rename is rolled back and reported', async () => {
        const user = userEvent.setup();
        vi.mocked(updateTask).mockRejectedValue(new ApiError(500, 'HTTP error: 500'));

        render(<TodoList projectId="p1" />);
        await screen.findByRole('listitem', { name: 'Buy milk' });

        await user.click(within(card('Buy milk')).getByRole('button', { name: 'rename' }));

        expect(
            await screen.findByText('The server encountered an error.'),
        ).toBeInTheDocument();
        expect(card('Buy milk')).toBeInTheDocument();
        expect(screen.queryByRole('listitem', { name: 'Buy milk (renamed)' })).not.toBeInTheDocument();
    });

    test('deleting removes the task once the server confirms', async () => {
        const user = userEvent.setup();
        vi.mocked(deleteTask).mockResolvedValue();

        render(<TodoList projectId="p1" />);
        await screen.findByRole('listitem', { name: 'Buy milk' });

        await user.click(within(card('Buy milk')).getByRole('button', { name: 'delete' }));

        expect(deleteTask).toHaveBeenCalledWith('p1', '1');
        await waitFor(() =>
            expect(screen.queryByRole('listitem', { name: 'Buy milk' })).not.toBeInTheDocument(),
        );
        expect(card('Walk dog')).toBeInTheDocument();
    });

    test('a failed delete keeps the task and reports the error', async () => {
        const user = userEvent.setup();
        vi.mocked(deleteTask).mockRejectedValue(new ApiError(400, 'HTTP error: 400'));

        render(<TodoList projectId="p1" />);
        await screen.findByRole('listitem', { name: 'Buy milk' });

        await user.click(within(card('Buy milk')).getByRole('button', { name: 'delete' }));

        expect(await screen.findByText('The request is invalid.')).toBeInTheDocument();
        expect(card('Buy milk')).toBeInTheDocument();
    });

    test('moving a task sends it to the end of the target column', async () => {
        const user = userEvent.setup();
        vi.mocked(moveTask).mockResolvedValue({ ...tasks[0], columnId: 'c-done', order: 1 });

        render(<TodoList projectId="p1" />);
        await screen.findByRole('listitem', { name: 'Buy milk' });

        await user.click(within(card('Buy milk')).getByRole('button', { name: 'move to done' }));

        // "Walk dog" is already in Done, so the moved task goes to position 1.
        expect(moveTask).toHaveBeenCalledWith('p1', '1', 'c-done', 1);
        expect(statusOf('Buy milk')).toHaveTextContent('done');
    });

    test('a failed move is rolled back and reported', async () => {
        const user = userEvent.setup();
        vi.mocked(moveTask).mockRejectedValue(new TypeError('Failed to fetch'));

        render(<TodoList projectId="p1" />);
        await screen.findByRole('listitem', { name: 'Buy milk' });

        await user.click(within(card('Buy milk')).getByRole('button', { name: 'move to done' }));

        expect(
            await screen.findByText('Unable to connect to the server.'),
        ).toBeInTheDocument();
        expect(statusOf('Buy milk')).toHaveTextContent('todo');
    });

    test('moving is a no-op when the project lacks the target column', async () => {
        const user = userEvent.setup();
        vi.mocked(getProject).mockResolvedValue(project([columns[0]]));

        render(<TodoList projectId="p1" />);
        await screen.findByRole('listitem', { name: 'Buy milk' });

        await user.click(within(card('Buy milk')).getByRole('button', { name: 'move to done' }));

        expect(moveTask).not.toHaveBeenCalled();
        expect(statusOf('Buy milk')).toHaveTextContent('todo');
    });

    describe('permissions and lifecycle', () => {
        test('a manager sees the invite panel with the owner id', async () => {
            vi.mocked(getProject).mockResolvedValue({ ...project(), canManage: true });

            render(<TodoList projectId="p1" />);

            expect(await screen.findByText('invite:u1')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Leave Project' })).not.toBeInTheDocument();
        });

        test('a non-owner can leave the project', async () => {
            vi.mocked(getProject).mockResolvedValue({ ...project(), isOwner: false });

            render(<TodoList projectId="p1" />);

            expect(await screen.findByRole('button', { name: 'Leave Project' })).toBeInTheDocument();
        });

        describe('leaving the project', () => {
            const original = window.location;

            beforeEach(() => {
                vi.mocked(getProject).mockResolvedValue({ ...project(), isOwner: false });
                Object.defineProperty(window, 'location', {
                    configurable: true,
                    value: { href: '/projects/p1' },
                });
            });

            afterEach(() => {
                Object.defineProperty(window, 'location', { configurable: true, value: original });
            });

            const clickLeave = async () => {
                render(<TodoList projectId="p1" />);
                await userEvent.click(await screen.findByRole('button', { name: 'Leave Project' }));
            };

            test('goes back home once confirmed', async () => {
                vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
                vi.mocked(leaveProject).mockResolvedValue('EDITOR');

                await clickLeave();

                await waitFor(() => expect(window.location.href).toBe('/'));
                expect(leaveProject).toHaveBeenCalledWith('p1');
            });

            test('stays when the confirmation is dismissed', async () => {
                vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);

                await clickLeave();

                await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
                expect(leaveProject).not.toHaveBeenCalled();
            });

            test('explains that an owner cannot leave', async () => {
                vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
                vi.mocked(leaveProject).mockResolvedValue('OWNER');

                await clickLeave();

                expect(await screen.findByText(/owner of the project and cannot leave/)).toBeInTheDocument();
                expect(window.location.href).toBe('/projects/p1');
            });

            test('shows the error when leaving fails', async () => {
                vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
                vi.mocked(leaveProject).mockRejectedValue(new ApiError(404, 'HTTP error: 404'));

                await clickLeave();

                expect(await screen.findByText('The requested resource was not found.')).toBeInTheDocument();
                expect(window.location.href).toBe('/projects/p1');
            });
        });

        test('a viewer cannot add tasks', async () => {
            vi.mocked(getProject).mockResolvedValue({ ...project(), role: 'VIEWER', canEdit: false });

            render(<TodoList projectId="p1" />);

            await screen.findByRole('listitem', { name: 'Buy milk' });
            expect(screen.queryByPlaceholderText('New Item')).not.toBeInTheDocument();
        });

        test('a project without columns puts every task in todo and blocks adding', async () => {
            vi.mocked(getProject).mockResolvedValue({ ...project(), columns: undefined });

            render(<TodoList projectId="p1" />);

            await screen.findByRole('listitem', { name: 'Buy milk' });
            expect(statusOf('Walk dog')).toHaveTextContent('todo');
            expect(screen.getByRole('button', { name: /add item/i })).toBeDisabled();
        });

        test('ignores a response that arrives after unmount', async () => {
            let resolve: (value: Task[]) => void = () => {};
            vi.mocked(getTasks).mockReturnValue(new Promise((r) => { resolve = r; }));

            const { unmount } = render(<TodoList projectId="p1" />);
            unmount();
            resolve(tasks);

            await waitFor(() => expect(getTasks).toHaveBeenCalled());
            expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
        });

        test('ignores an error that arrives after unmount', async () => {
            let reject: (error: Error) => void = () => {};
            vi.mocked(getTasks).mockReturnValue(new Promise((_, r) => { reject = r; }));

            const { unmount } = render(<TodoList projectId="p1" />);
            unmount();
            reject(new Error('late'));

            await waitFor(() => expect(console.error).toHaveBeenCalledWith(expect.any(Error)));
        });
    });
});
