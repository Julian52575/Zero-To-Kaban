import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemDisplay from './ItemDisplay';
import type { Item } from '../types/item';

describe('ItemDisplay', () => {
    const item: Item = { id: '1', name: 'Buy milk', completed: false, status: 'todo' };

    function setup() {
        const onRename = vi.fn();
        const onDelete = vi.fn();
        render(<ItemDisplay item={item} onRename={onRename} onDelete={onDelete} />);
        return { user: userEvent.setup(), onRename, onDelete };
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
        const { user, onRename } = setup();

        await user.dblClick(screen.getByText('Buy milk'));
        await user.clear(screen.getByRole('textbox'));
        await user.type(screen.getByRole('textbox'), 'Buy oat milk{Enter}');

        expect(onRename).toHaveBeenCalledWith(item, 'Buy oat milk');
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    test('clicking OK saves the new name', async () => {
        const { user, onRename } = setup();

        await user.dblClick(screen.getByText('Buy milk'));
        await user.type(screen.getByRole('textbox'), '!');
        await user.click(screen.getByRole('button', { name: 'OK' }));

        expect(onRename).toHaveBeenCalledWith(item, 'Buy milk!');
    });

    test('pressing Escape cancels the edit without renaming', async () => {
        const { user, onRename } = setup();

        await user.dblClick(screen.getByText('Buy milk'));
        await user.type(screen.getByRole('textbox'), ' draft{Escape}');

        expect(onRename).not.toHaveBeenCalled();
        expect(screen.getByText('Buy milk')).toBeInTheDocument();

        // Re-entering edit mode starts from the original name, not the discarded draft.
        await user.dblClick(screen.getByText('Buy milk'));
        expect(screen.getByRole('textbox')).toHaveValue('Buy milk');
    });
});
