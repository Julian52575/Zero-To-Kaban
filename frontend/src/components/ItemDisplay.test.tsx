import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemDisplay from './ItemDisplay';
import type { Task } from '../types/task';

describe('ItemDisplay', () => {
    const item: Task = { id: '1', title: 'Buy milk', order: 0, columnId: 'c1', completed: false, status: 'todo' };

    function setup() {
        const onUpdate = vi.fn();
        const onDelete = vi.fn();
        render(<ItemDisplay item={item} onUpdate={onUpdate} onDelete={onDelete} />);
        return { user: userEvent.setup(), onUpdate, onDelete };
    }

    test('renders the item name and a delete button', () => {
        setup();

        expect(screen.getByText('Buy milk')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Delete "Buy milk"' }),
        ).toBeInTheDocument();
    });

    test('clicking delete reports the item', async () => {
        const { user, onDelete } = setup();

        await user.click(screen.getByRole('button', { name: 'Delete "Buy milk"' }));

        expect(onDelete).toHaveBeenCalledWith(item);
    });

    test('double-clicking the name switches to an edit field', async () => {
        const { user } = setup();

        await user.dblClick(screen.getByText('Buy milk'));

        expect(screen.getByRole('textbox')).toHaveValue('Buy milk');
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    test('pressing Enter saves the new name', async () => {
        const { user, onUpdate } = setup();

        await user.dblClick(screen.getByText('Buy milk'));
        await user.clear(screen.getByRole('textbox'));
        await user.type(screen.getByRole('textbox'), 'Buy oat milk{Enter}');

        expect(onUpdate).toHaveBeenCalledWith(item, { title: 'Buy oat milk' });
    });

    test('clicking OK saves the new name', async () => {
        const { user, onUpdate } = setup();

        await user.dblClick(screen.getByText('Buy milk'));
        await user.type(screen.getByRole('textbox'), '!');
        await user.click(screen.getByRole('button', { name: 'OK' }));

        expect(onUpdate).toHaveBeenCalledWith(item, { title: 'Buy milk!' });
    });

    test('pressing Escape cancels the edit without renaming', async () => {
        const { user, onUpdate } = setup();

        await user.dblClick(screen.getByText('Buy milk'));
        await user.type(screen.getByRole('textbox'), ' draft{Escape}');

        expect(onUpdate).not.toHaveBeenCalled();
        expect(screen.getByText('Buy milk')).toBeInTheDocument();

        // Re-entering edit mode starts from the original name, not the discarded draft.
        await user.dblClick(screen.getByText('Buy milk'));
        expect(screen.getByRole('textbox')).toHaveValue('Buy milk');
    });

    describe('display', () => {
        const members = [
            { id: 'u1', pseudo: 'Alice' },
            { id: 'u2', pseudo: 'Bob' },
        ];

        function renderItem(overrides: Partial<Task> = {}, props: Record<string, unknown> = {}) {
            const onUpdate = vi.fn();
            const onDelete = vi.fn();
            render(
                <ItemDisplay
                    item={{ ...item, ...overrides }}
                    members={members}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    {...props}
                />,
            );
            return { onUpdate, onDelete, user: userEvent.setup() };
        }

        test.each([
            ['HIGH', 'High'],
            ['MEDIUM', 'Medium'],
            ['LOW', 'Low'],
        ] as const)('shows a %s priority badge', (priority, label) => {
            renderItem({ priority });

            expect(screen.getByText(label)).toBeInTheDocument();
        });

        test('shows no priority badge for an unknown priority', () => {
            renderItem({ priority: 'URGENT' as never });

            expect(screen.queryByText('High')).not.toBeInTheDocument();
        });

        test('a completed task is struck through', () => {
            renderItem({ completed: true });

            expect(screen.getByText('Buy milk')).toHaveClass('text-decoration-line-through');
        });

        test('shows a future due date without the overdue title', () => {
            renderItem({ dueDate: new Date('2999-01-01') });

            expect(screen.getByTitle('Échéance')).toBeInTheDocument();
        });

        test('flags a past due date as overdue', () => {
            renderItem({ dueDate: new Date('2000-01-01') });

            expect(screen.getByTitle('En retard')).toBeInTheDocument();
        });

        test('a completed task is never overdue', () => {
            renderItem({ dueDate: new Date('2000-01-01'), completed: true });

            expect(screen.getByTitle('Échéance')).toBeInTheDocument();
        });
    });

    describe('assignee', () => {
        const members = [
            { id: 'u1', pseudo: 'Alice' },
            { id: 'u2', pseudo: 'Bob' },
        ];

        function renderItem(overrides: Partial<Task> = {}, props: Record<string, unknown> = {}) {
            const onUpdate = vi.fn();
            render(
                <ItemDisplay
                    item={{ ...item, ...overrides }}
                    members={members}
                    onUpdate={onUpdate}
                    onDelete={vi.fn()}
                    {...props}
                />,
            );
            return { onUpdate, user: userEvent.setup() };
        }

        test('shows the assigned member', () => {
            renderItem({ assigneeId: 'u1' });

            expect(screen.getByText('Alice')).toBeInTheDocument();
        });

        test('keeps a removed member visible', () => {
            renderItem({ assigneeId: 'gone' });

            expect(screen.getByText('Ancien membre')).toBeInTheDocument();
        });

        test('assigning a member reports the change', async () => {
            const { onUpdate, user } = renderItem();

            await user.click(screen.getByRole('combobox'));
            await user.click(await screen.findByText('Bob'));

            expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), {
                assigneeId: 'u2',
            });
        });

        test('clearing the assignee reports null', async () => {
            const { onUpdate, user } = renderItem({ assigneeId: 'u1' });

            await user.click(screen.getByRole('combobox'));
            await user.keyboard('{Backspace}');

            expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), {
                assigneeId: null,
            });
        });

        test('says so when there are no members', async () => {
            const { user } = renderItem({}, { members: [] });

            await user.click(screen.getByRole('combobox'));

            expect(await screen.findByText('Aucun membre')).toBeInTheDocument();
        });

        test('the selector is disabled without an update handler', () => {
            render(<ItemDisplay item={item} onDelete={vi.fn()} />);

            expect(document.getElementById('assignee-1')).toBeDisabled();
        });
    });

    describe('read-only', () => {
        test('hides delete and cannot be renamed', async () => {
            const user = userEvent.setup();
            render(
                <ItemDisplay item={item} canEdit={false} onUpdate={vi.fn()} onDelete={vi.fn()} />,
            );

            await user.dblClick(screen.getByText('Buy milk'));

            expect(screen.queryByRole('button', { name: 'Delete "Buy milk"' })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'OK' })).not.toBeInTheDocument();
        });
    });

    describe('editing', () => {
        test('a blank name is not saved', async () => {
            const { user, onUpdate } = setup();

            await user.dblClick(screen.getByText('Buy milk'));
            await user.clear(screen.getByRole('textbox'));
            await user.type(screen.getByRole('textbox'), '   {Enter}');

            expect(onUpdate).not.toHaveBeenCalled();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        test('saving without an update handler does not throw', async () => {
            const user = userEvent.setup();
            render(<ItemDisplay item={item} onDelete={vi.fn()} />);

            await user.dblClick(screen.getByText('Buy milk'));
            await user.type(screen.getByRole('textbox'), '!{Enter}');

            expect(screen.queryByDisplayValue('Buy milk!')).not.toBeInTheDocument();
        });
    });

    describe('details modal', () => {
        test('clicking the card opens the details and saving reports the changes', async () => {
            const { user, onUpdate } = setup();

            await user.click(screen.getByText('Buy milk'));
            const [title] = await screen.findAllByRole('textbox');
            await user.clear(title);
            await user.type(title, 'Buy oat milk');
            await user.click(screen.getByText('Save changes'));

            expect(onUpdate).toHaveBeenCalledWith(
                item,
                expect.objectContaining({ title: 'Buy oat milk' }),
            );
            expect(onUpdate).toHaveBeenCalledWith(item, { title: 'Buy oat milk' });
        });

        test('saving details without a handler does not throw', async () => {
            const user = userEvent.setup();
            render(<ItemDisplay item={item} onDelete={vi.fn()} />);

            await user.click(screen.getByText('Buy milk'));
            await user.click(await screen.findByText('Save changes'));

            await waitFor(() =>
                expect(screen.queryByText('Task details')).not.toBeInTheDocument(),
            );
        });

        test('saving details with an unchanged title reports once', async () => {
            const { user, onUpdate } = setup();

            await user.click(screen.getByText('Buy milk'));
            await user.click(await screen.findByText('Save changes'));

            expect(onUpdate).toHaveBeenCalledTimes(1);
        });

        test('clicking the checkbox or delete does not open the details', async () => {
            const { user } = setup();

            await user.click(screen.getByRole('checkbox'));
            await user.click(screen.getByRole('button', { name: 'Delete "Buy milk"' }));

            expect(screen.queryByText('Task details')).not.toBeInTheDocument();
        });
    });
});
