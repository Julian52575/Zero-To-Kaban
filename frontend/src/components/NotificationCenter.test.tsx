import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationCenter from './NotificationCenter';
import { useNotifications } from '../provider/useNotificationsProvider';
import { AcceptInvitation, declineInvitation } from '../services/ProjectApi';

vi.mock('../provider/useNotificationsProvider', () => ({ useNotifications: vi.fn() }));
vi.mock('../services/ProjectApi', () => ({
    AcceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
}));

const markAllTaskAsRead = vi.fn();
const resolveNotification = vi.fn();

const invitation = {
    id: 'n1',
    type: 'invitation',
    title: 'Invitation',
    message: 'Join us',
    projectId: 'p1',
    collaboratorId: 'c1',
};

function setup(unreadNotifications: unknown[], onProjectAccepted?: (project: unknown) => void) {
    vi.mocked(useNotifications).mockReturnValue({
        unreadNotifications,
        markAllTaskAsRead,
        resolveNotification,
    } as never);
    render(<NotificationCenter onProjectAccepted={onProjectAccepted} />);
}

const open = () => userEvent.click(screen.getByRole('button', { name: 'Open notifications' }));

describe('NotificationCenter', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('shows an empty state and no badge without notifications', async () => {
        setup([]);
        await open();

        expect(screen.getByText('No notifications.')).toBeInTheDocument();
    });

    test('shows the unread count, capped at 9+', () => {
        setup(Array.from({ length: 12 }, (_, i) => ({ ...invitation, id: `n${i}`, type: 'task' })));

        expect(screen.getByText('9+')).toBeInTheDocument();
    });

    test('shows the exact count under 10', () => {
        setup([{ ...invitation, type: 'task' }]);

        expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('closing marks everything as read', async () => {
        setup([{ ...invitation, type: 'task' }]);
        await open();

        await userEvent.click(screen.getByRole('button', { name: /close/i }));

        expect(markAllTaskAsRead).toHaveBeenCalled();
    });

    test('accepting an invitation resolves it', async () => {
        vi.mocked(AcceptInvitation).mockResolvedValue({});
        setup([invitation]);
        await open();

        await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

        expect(AcceptInvitation).toHaveBeenCalledWith('p1', 'c1');
        await waitFor(() => expect(resolveNotification).toHaveBeenCalledWith('n1'));
    });

    test('accepting an invitation hands the joined project to the parent', async () => {
        vi.mocked(AcceptInvitation).mockResolvedValue({
            state: 'ACCEPTED',
            role: 'EDITOR',
            project: { id: 'p1', name: 'Alpha' },
        });
        const onProjectAccepted = vi.fn();
        setup([invitation], onProjectAccepted);
        await open();

        await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

        await waitFor(() => expect(onProjectAccepted).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'p1', name: 'Alpha', role: 'EDITOR', isOwner: false }),
        ));
        expect(resolveNotification).toHaveBeenCalledWith('n1');
    });

    test('a project accepted as owner is flagged as owned', async () => {
        vi.mocked(AcceptInvitation).mockResolvedValue({
            state: 'ACCEPTED',
            role: 'OWNER',
            project: { id: 'p1', name: 'Alpha' },
        });
        const onProjectAccepted = vi.fn();
        setup([invitation], onProjectAccepted);
        await open();

        await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

        await waitFor(() => expect(onProjectAccepted).toHaveBeenCalledWith(
            expect.objectContaining({ isOwner: true }),
        ));
    });

    test('declining an invitation resolves it', async () => {
        vi.mocked(declineInvitation).mockResolvedValue({});
        setup([invitation]);
        await open();

        await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

        expect(declineInvitation).toHaveBeenCalledWith('p1', 'c1');
        await waitFor(() => expect(resolveNotification).toHaveBeenCalledWith('n1'));
    });

    test('a failed accept or decline is logged and not resolved', async () => {
        vi.mocked(AcceptInvitation).mockRejectedValue(new Error('down'));
        vi.mocked(declineInvitation).mockRejectedValue(new Error('down'));
        setup([invitation]);
        await open();

        await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
        await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

        await waitFor(() => expect(console.error).toHaveBeenCalledTimes(2));
        expect(resolveNotification).not.toHaveBeenCalled();
    });

    test('an invitation without ids is ignored', async () => {
        setup([{ ...invitation, projectId: undefined, collaboratorId: undefined }]);
        await open();

        await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
        await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

        expect(AcceptInvitation).not.toHaveBeenCalled();
        expect(declineInvitation).not.toHaveBeenCalled();
    });
});
