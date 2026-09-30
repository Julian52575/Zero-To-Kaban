import { describe, test, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import KanbanBoard from './KanbanBoard';
import type { Task } from '../types/task';
import { getProjectCollaborators } from '../services/ProjectApi';

// jsdom has no layout, so drag events are driven through the captured handlers.
let handlers: {
    onDragStart: (e: unknown) => void;
    onDragEnd: (e: unknown) => void;
    onDragCancel: () => void;
};

vi.mock('@dnd-kit/core', () => ({
    DndContext: (props: typeof handlers & { children: React.ReactNode }) => {
        handlers = props;
        return <div>{props.children}</div>;
    },
    DragOverlay: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="overlay">{children}</div>
    ),
    PointerSensor: class {},
    KeyboardSensor: class {},
    useSensor: vi.fn(),
    useSensors: vi.fn(),
    useDraggable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: () => {},
        isDragging: true,
    }),
    useDroppable: () => ({ setNodeRef: () => {}, isOver: true }),
}));

vi.mock('../services/ProjectApi', () => ({ getProjectCollaborators: vi.fn() }));
vi.mock('./ItemDisplay', () => ({
    default: ({ item, members }: { item: Task; members: { pseudo: string }[] }) => (
        <span>
            {item.title}:{members.map((m) => m.pseudo).join(',')}
        </span>
    ),
}));

const task = (id: string, status: Task['status']): Task => ({
    id,
    title: `Task ${id}`,
    order: 0,
    columnId: 'c1',
    status,
});

const items = [task('1', 'todo'), task('2', 'doing')];

function setup() {
    const onStatusChange = vi.fn();
    render(
        <KanbanBoard
            items={items}
            projectId="p1"
            onItemUpdate={vi.fn()}
            onItemDelete={vi.fn()}
            onStatusChange={onStatusChange}
        />,
    );
    return { onStatusChange };
}

describe('KanbanBoard drag and drop', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(getProjectCollaborators).mockResolvedValue([{ id: 'u1', pseudo: 'Alice' }]);
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('passes the project collaborators to the cards', async () => {
        setup();

        expect(await screen.findByText('Task 1:Alice')).toBeInTheDocument();
        expect(getProjectCollaborators).toHaveBeenCalledWith('p1');
    });

    test('logs when the collaborators cannot be loaded', async () => {
        vi.mocked(getProjectCollaborators).mockRejectedValue(new Error('down'));
        setup();

        await waitFor(() => expect(console.error).toHaveBeenCalled());
    });

    test('shows the dragged card in the overlay and clears it on cancel', () => {
        setup();

        act(() => handlers.onDragStart({ active: { id: '1' } }));
        expect(screen.getByTestId('overlay')).toHaveTextContent('Task 1');

        act(() => handlers.onDragCancel());
        expect(screen.getByTestId('overlay')).toBeEmptyDOMElement();
    });

    test('dropping on another column changes the status', () => {
        const { onStatusChange } = setup();

        act(() => handlers.onDragStart({ active: { id: '1' } }));
        act(() => handlers.onDragEnd({ active: { id: '1' }, over: { id: 'done' } }));

        expect(onStatusChange).toHaveBeenCalledWith(items[0], 'done');
        expect(screen.getByTestId('overlay')).toBeEmptyDOMElement();
    });

    test('dropping outside a column does nothing', () => {
        const { onStatusChange } = setup();

        act(() => handlers.onDragEnd({ active: { id: '1' }, over: null }));

        expect(onStatusChange).not.toHaveBeenCalled();
    });

    test('dropping on the same column does nothing', () => {
        const { onStatusChange } = setup();

        act(() => handlers.onDragEnd({ active: { id: '1' }, over: { id: 'todo' } }));

        expect(onStatusChange).not.toHaveBeenCalled();
    });

    test('dropping an unknown card does nothing', () => {
        const { onStatusChange } = setup();

        act(() => handlers.onDragEnd({ active: { id: 'ghost' }, over: { id: 'done' } }));

        expect(onStatusChange).not.toHaveBeenCalled();
    });
});
