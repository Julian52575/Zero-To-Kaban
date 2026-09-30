import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
