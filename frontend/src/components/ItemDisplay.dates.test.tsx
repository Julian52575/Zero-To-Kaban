import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ItemDisplay from './ItemDisplay';
import type { Task } from '../types/task';

// The real modal calls dueDate.toISOString() eagerly, which a raw ISO string
// (as the API sends it) would break; stubbing it isolates ItemDisplay's parsing.
vi.mock('./TaskDetailsModal', () => ({ default: () => null }));

const item: Task = { id: '1', title: 'Buy milk', order: 0, columnId: 'c1' };

const show = (dueDate: unknown) =>
    render(<ItemDisplay item={{ ...item, dueDate: dueDate as Date }} onDelete={vi.fn()} />);

describe('ItemDisplay due date parsing', () => {
    test('accepts an ISO string', () => {
        show('2999-01-01T00:00:00.000Z');

        expect(screen.getByTitle('Échéance')).toBeInTheDocument();
    });

    test('ignores an invalid date', () => {
        show('not a date');

        expect(screen.queryByTitle('Échéance')).not.toBeInTheDocument();
        expect(screen.queryByTitle('En retard')).not.toBeInTheDocument();
    });
});
