import { describe, test, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import KanbanBoard, { getStatus } from './KanbanBoard';
import type { Task } from '../types/task';

vi.mock('../services/ProjectApi', () => ({
    getProjectCollaborators: vi.fn().mockResolvedValue([]),
}));

const task = (id: string, title: string, completed: boolean, status?: Task['status']): Task => ({
    id,
    title,
    order: 0,
    columnId: 'c1',
    completed,
    status,
});

describe('getStatus', () => {
    test('uses the explicit status when there is one', () => {
        expect(getStatus(task('1', 'a', true, 'doing'))).toBe('doing');
    });

    test('falls back to "completed" when there is no status', () => {
        expect(getStatus(task('1', 'a', true))).toBe('done');
        expect(getStatus(task('1', 'a', false))).toBe('todo');
    });
});

describe('KanbanBoard', () => {
    const items: Task[] = [
        task('1', 'Buy milk', false, 'todo'),
        task('2', 'Write report', false, 'doing'),
        task('3', 'Walk dog', true, 'done'),
        task('4', 'Pay rent', false, 'todo'),
    ];

    function renderBoard(boardItems: Task[] = items) {
        render(
            <KanbanBoard
                items={boardItems}
                projectId="p1"
                onItemUpdate={vi.fn()}
                onItemDelete={vi.fn()}
                onStatusChange={vi.fn()}
            />,
        );
    }

    test('renders each item in the column matching its status', () => {
        renderBoard();

        const todo = screen.getByRole('region', { name: 'To Do' });
        const doing = screen.getByRole('region', { name: 'Doing' });
        const done = screen.getByRole('region', { name: 'Done' });

        expect(within(todo).getByText('Buy milk')).toBeInTheDocument();
        expect(within(todo).getByText('Pay rent')).toBeInTheDocument();
        expect(within(doing).getByText('Write report')).toBeInTheDocument();
        expect(within(done).getByText('Walk dog')).toBeInTheDocument();
        expect(within(done).queryByText('Buy milk')).not.toBeInTheDocument();
    });

    test('shows a count per column and a placeholder for empty columns', () => {
        renderBoard([items[0]]);

        const todo = screen.getByRole('region', { name: 'To Do' });
        const doing = screen.getByRole('region', { name: 'Doing' });

        expect(within(todo).getByText('1')).toBeInTheDocument();
        expect(within(todo).queryByText('Drag tasks here')).not.toBeInTheDocument();
        expect(within(doing).getByText('0')).toBeInTheDocument();
        expect(within(doing).getByText('Drag tasks here')).toBeInTheDocument();
    });

    test('gives every card a drag handle', () => {
        renderBoard();

        expect(screen.getByRole('button', { name: 'Déplacer "Buy milk"' })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /^Déplacer/ })).toHaveLength(items.length);
    });
});
