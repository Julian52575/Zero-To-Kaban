import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskDetailsModal from './TaskDetailsModal';
import type { Task } from '../types/task';

const users = [
    { id: 'u1', pseudo: 'Alice' },
    { id: 'u2', pseudo: 'Bob' },
];

const task: Task = {
    id: 't1',
    title: 'Buy milk',
    description: 'Semi-skimmed',
    order: 0,
    columnId: 'c1',
    assigneeId: 'u1',
    dueDate: new Date('2026-05-01T00:00:00.000Z'),
    priority: 'HIGH',
    status: 'doing',
};

function setup(item: Task = task, show = true) {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const view = render(
        <TaskDetailsModal item={item} users={users} show={show} onClose={onClose} onSave={onSave} />,
    );
    const [title, description] = show ? screen.getAllByRole('textbox') : [];
    const [assignee, priority, status] = show ? screen.getAllByRole('combobox') : [];
    const date = show ? (document.querySelector('input[type="date"]') as HTMLInputElement) : null;
    return { onSave, onClose, view, title, description, assignee, priority, status, date };
}

describe('TaskDetailsModal', () => {
    test('shows the task values', () => {
        const { title, description, assignee, priority, status, date } = setup();

        expect(title).toHaveValue('Buy milk');
        expect(description).toHaveValue('Semi-skimmed');
        expect(assignee).toHaveValue('u1');
        expect(priority).toHaveValue('HIGH');
        expect(status).toHaveValue('doing');
        expect(date).toHaveValue('2026-05-01');
    });

    test('falls back to defaults for a bare task', () => {
        const { description, assignee, status, date } = setup({
            id: 't2',
            title: 'Bare',
            order: 0,
            columnId: 'c1',
        });

        expect(description).toHaveValue('');
        expect(assignee).toHaveValue('');
        expect(status).toHaveValue('todo');
        expect(date).toHaveValue('');
    });

    test('a completed task without a status defaults to done', () => {
        const { status } = setup({ id: 't3', title: 'x', order: 0, columnId: 'c1', completed: true });

        expect(status).toHaveValue('done');
    });

    test('saves the edited values and closes', async () => {
        const { onSave, onClose, title, description, assignee, priority, status, date } = setup();

        await userEvent.clear(title);
        await userEvent.type(title, '  Buy oat milk  ');
        await userEvent.clear(description);
        await userEvent.type(description, ' Oat ');
        await userEvent.selectOptions(assignee, 'u2');
        await userEvent.selectOptions(priority, 'LOW');
        await userEvent.selectOptions(status, 'done');
        fireEvent.change(date!, { target: { value: '2026-06-02' } });
        await userEvent.click(screen.getByText('Save changes'));

        expect(onSave).toHaveBeenCalledWith(task, {
            title: 'Buy oat milk',
            description: 'Oat',
            assigneeId: 'u2',
            dueDate: new Date('2026-06-02'),
            priority: 'LOW',
            status: 'done',
            completed: true,
        });
        expect(onClose).toHaveBeenCalled();
    });

    test('clearing the deadline saves a null due date', () => {
        const { onSave, date } = setup();

        fireEvent.change(date!, { target: { value: '' } });
        fireEvent.click(screen.getByText('Save changes'));

        expect(onSave).toHaveBeenCalledWith(
            task,
            expect.objectContaining({ dueDate: null }),
        );
    });

    test('a blank title is not saved', async () => {
        const { onSave, onClose, title } = setup();

        await userEvent.clear(title);
        await userEvent.click(screen.getByText('Save changes'));

        expect(onSave).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    test('cancel closes without saving', async () => {
        const { onSave, onClose } = setup();

        await userEvent.click(screen.getByText('Cancel'));

        expect(onClose).toHaveBeenCalled();
        expect(onSave).not.toHaveBeenCalled();
    });

    test('reopening resets unsaved edits', async () => {
        const { view, title, onSave, onClose } = setup();
        await userEvent.type(title, ' draft');

        view.rerender(
            <TaskDetailsModal item={task} users={users} show={false} onClose={onClose} onSave={onSave} />,
        );
        view.rerender(
            <TaskDetailsModal item={task} users={users} show onClose={onClose} onSave={onSave} />,
        );

        expect(screen.getAllByRole('textbox')[0]).toHaveValue('Buy milk');
    });
});
