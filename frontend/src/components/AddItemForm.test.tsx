import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddItemForm from './AddItemForm';
import { createTask } from '../services/taskService';
import { ApiError } from '../services/apiClient';

vi.mock('../services/taskService', () => ({
    createTask: vi.fn(),
}));

const mockedCreateTask = vi.mocked(createTask);

describe('AddItemForm', () => {
    beforeEach(() => {
        mockedCreateTask.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('the submit button is disabled until text is entered', async () => {
        const user = userEvent.setup();
        render(<AddItemForm projectId="p1" columnId="c-todo" onNewItem={vi.fn()} />);

        const button = screen.getByRole('button', { name: /add item/i });
        expect(button).toBeDisabled();

        await user.type(screen.getByPlaceholderText('New Item'), '   ');
        expect(button).toBeDisabled();

        await user.type(screen.getByPlaceholderText('New Item'), 'Buy milk');
        expect(button).toBeEnabled();
    });

    test('the submit button stays disabled when there is no column to add to', async () => {
        const user = userEvent.setup();
        render(<AddItemForm projectId="p1" onNewItem={vi.fn()} />);

        await user.type(screen.getByPlaceholderText('New Item'), 'Buy milk');

        expect(screen.getByRole('button', { name: /add item/i })).toBeDisabled();
    });

    test('submitting creates the task and reports it back', async () => {
        const user = userEvent.setup();
        const onNewItem = vi.fn();
        const task = { id: 't1', title: 'Buy milk', order: 0, columnId: 'c-todo' };
        mockedCreateTask.mockResolvedValue(task);

        render(<AddItemForm projectId="p1" columnId="c-todo" onNewItem={onNewItem} />);

        await user.type(screen.getByPlaceholderText('New Item'), '  Buy milk  ');
        await user.click(screen.getByRole('button', { name: /add item/i }));

        expect(mockedCreateTask).toHaveBeenCalledTimes(1);
        expect(mockedCreateTask).toHaveBeenCalledWith('p1', {
            title: 'Buy milk',
            columnId: 'c-todo',
        });

        await waitFor(() => expect(onNewItem).toHaveBeenCalledWith(task));
        expect(screen.getByPlaceholderText('New Item')).toHaveValue('');
    });

    test('shows "Adding..." while the request is in flight', async () => {
        const user = userEvent.setup();
        mockedCreateTask.mockReturnValue(new Promise(() => {}));

        render(<AddItemForm projectId="p1" columnId="c-todo" onNewItem={vi.fn()} />);

        await user.type(screen.getByPlaceholderText('New Item'), 'Buy milk');
        await user.click(screen.getByRole('button', { name: /add item/i }));

        expect(screen.getByRole('button', { name: 'Adding...' })).toBeDisabled();
    });

    test('shows an error and keeps the input when creation fails', async () => {
        const user = userEvent.setup();
        const onNewItem = vi.fn();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        mockedCreateTask.mockRejectedValue(new ApiError(500, 'HTTP error: 500'));

        render(<AddItemForm projectId="p1" columnId="c-todo" onNewItem={onNewItem} />);

        await user.type(screen.getByPlaceholderText('New Item'), 'Buy milk');
        await user.click(screen.getByRole('button', { name: /add item/i }));

        expect(
            await screen.findByText('The server encountered an error.'),
        ).toBeInTheDocument();
        expect(onNewItem).not.toHaveBeenCalled();
        expect(screen.getByPlaceholderText('New Item')).toHaveValue('Buy milk');
        expect(screen.getByRole('button', { name: /add item/i })).toBeEnabled();
    });
});
