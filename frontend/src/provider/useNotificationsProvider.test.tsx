import { describe, test, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider, useNotifications } from './useNotificationsProvider';
import { useWebSocket } from '../hooks/useWebSocket';
import { fetchUnreadNotifications, markNotificationAsRead } from '../services/notificationService';

vi.mock('../hooks/useWebSocket', () => ({ useWebSocket: vi.fn() }));
vi.mock('../services/notificationService', () => ({
    fetchUnreadNotifications: vi.fn(),
    markNotificationAsRead: vi.fn(),
}));

let emit: (type: string, data: unknown, eventId: string) => void = () => {};

function Probe() {
    const { unreadNotifications, markAllTaskAsRead, resolveNotification } = useNotifications();
    return (
        <div>
            <ul>
                {unreadNotifications.map((n) => (
                    <li key={n.id}>
                        {n.id}|{n.type}|{n.message}|{n.projectId}|{n.collaboratorId}
                    </li>
                ))}
            </ul>
            <button onClick={markAllTaskAsRead}>mark-all</button>
            <button onClick={() => resolveNotification('inv')}>resolve</button>
        </div>
    );
}

async function renderProvider() {
    render(
        <NotificationProvider delay={100000}>
            <Probe />
        </NotificationProvider>,
    );
    // let the initial unread fetch settle so it can't overwrite emitted events
    await act(async () => {});
}

describe('NotificationProvider', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(fetchUnreadNotifications).mockResolvedValue([]);
        vi.mocked(markNotificationAsRead).mockResolvedValue(undefined);
        vi.mocked(useWebSocket).mockImplementation((cb) => {
            emit = cb;
        });
    });

    test('useNotifications throws outside the provider', () => {
        expect(() => render(<Probe />)).toThrow(
            'useNotifications must be used inside NotificationProvider',
        );
    });

    test('maps unread notifications fetched from the API', async () => {
        vi.mocked(fetchUnreadNotifications).mockResolvedValue([
            { id: 'a', type: 'task.assigned.v1', data: { title: 'Fix' } },
            { id: 'b', type: 'project.invitation.v1', data: { projectId: 'p1', userId: 'u1' } },
        ] as never);
        await renderProvider();

        expect(await screen.findByText(/^a\|task\|You were assigned to "Fix"\./)).toBeInTheDocument();
        expect(
            screen.getByText('b|invitation|You have been invited to a project.|p1|u1'),
        ).toBeInTheDocument();
    });

    test('a task assignment event adds an unread notification and a toast', async () => {
        await renderProvider();

        act(() => emit('task.assigned.v1', { title: 'Fix' }, 'e1'));

        expect(await screen.findByText(/e1\|task\|You were assigned to task "Fix"\./)).toBeInTheDocument();
        expect(screen.getByText('Task assigned')).toBeInTheDocument();
    });

    test('an invitation event adds an invitation, once per event id', async () => {
        await renderProvider();

        act(() => emit('project.invitation.v1', { projectId: 'p1', userId: 'u1' }, 'inv'));
        act(() => emit('project.invitation.v1', { projectId: 'p1', userId: 'u1' }, 'inv'));

        expect(await screen.findAllByText(/^inv\|invitation\|/)).toHaveLength(1);
    });

    test('unknown events are logged', async () => {
        await renderProvider();

        act(() => emit('other.v1', {}, 'x'));

        expect(console.log).toHaveBeenCalledWith('Unknown notification type:', 'other.v1');
    });

    test('mark-all clears task notifications and marks them read', async () => {
        await renderProvider();
        act(() => emit('task.assigned.v1', { title: 'Fix' }, 't1'));
        act(() => emit('project.invitation.v1', { projectId: 'p', userId: 'u' }, 'inv'));

        await userEvent.click(screen.getByRole('button', { name: 'mark-all' }));

        expect(markNotificationAsRead).toHaveBeenCalledWith('t1');
        expect(screen.queryByText(/^t1\|/)).not.toBeInTheDocument();
        expect(screen.getByText(/^inv\|/)).toBeInTheDocument();
    });

    test('resolving removes the notification and marks it read', async () => {
        await renderProvider();
        act(() => emit('project.invitation.v1', { projectId: 'p', userId: 'u' }, 'inv'));

        await userEvent.click(screen.getByRole('button', { name: 'resolve' }));

        expect(markNotificationAsRead).toHaveBeenCalledWith('inv');
        expect(screen.queryByText(/^inv\|/)).not.toBeInTheDocument();
    });

    test('a failed mark-as-read is logged', async () => {
        vi.mocked(markNotificationAsRead).mockRejectedValue(new Error('down'));
        await renderProvider();
        act(() => emit('task.assigned.v1', { title: 'Fix' }, 't1'));
        act(() => emit('project.invitation.v1', { projectId: 'p', userId: 'u' }, 'inv'));

        await userEvent.click(screen.getByRole('button', { name: 'mark-all' }));
        await userEvent.click(screen.getByRole('button', { name: 'resolve' }));

        await waitFor(() => expect(console.error).toHaveBeenCalledTimes(2));
    });

    test('a toast can be dismissed', async () => {
        await renderProvider();
        act(() => emit('task.assigned.v1', { title: 'Fix' }, 't1'));

        await userEvent.click(await screen.findByRole('button', { name: /close/i }));

        await waitFor(() => expect(screen.queryByText('Task assigned')).not.toBeInTheDocument());
    });
});
