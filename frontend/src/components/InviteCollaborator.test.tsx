import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteCollaborator from './InviteCollaborator';
import { getAllUsers } from '../services/collaboratorService';
import { getProjectCollaborators, inviteCollaborator } from '../services/ProjectApi';

vi.mock('../services/collaboratorService', () => ({ getAllUsers: vi.fn() }));
vi.mock('../services/ProjectApi', () => ({
    getProjectCollaborators: vi.fn(),
    inviteCollaborator: vi.fn(),
}));

const users = [
    { id: 'owner', pseudo: 'Owner' },
    { id: 'member', pseudo: 'Member' },
    { id: 'bob', pseudo: 'Bob' },
    { id: 'carol', pseudo: 'Carol' },
];

async function openPanel(ownerId = 'owner') {
    render(<InviteCollaborator projectId="p1" ownerId={ownerId} />);
    await waitFor(() => expect(getAllUsers).toHaveBeenCalled());
    await userEvent.click(screen.getByRole('button', { name: 'Invite collaborator' }));
}

async function pick(name: string) {
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText(name));
}

describe('InviteCollaborator', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(getAllUsers).mockResolvedValue(users);
        vi.mocked(getProjectCollaborators).mockResolvedValue([{ id: 'member', pseudo: 'Member' }]);
    });

    test('offers everyone except the owner and existing collaborators', async () => {
        await openPanel();

        await userEvent.click(screen.getByRole('combobox'));

        expect(await screen.findByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Carol')).toBeInTheDocument();
        expect(screen.queryByText('Owner')).not.toBeInTheDocument();
        expect(screen.queryByText('Member')).not.toBeInTheDocument();
    });

    test('works without an owner id', async () => {
        await openPanel('');

        await userEvent.click(screen.getByRole('combobox'));

        expect(await screen.findByText('Owner')).toBeInTheDocument();
    });

    test('says so when nobody is left to invite', async () => {
        vi.mocked(getAllUsers).mockResolvedValue([users[0]]);
        await openPanel();

        await userEvent.click(screen.getByRole('combobox'));

        expect(await screen.findByText('Aucun collaborateur trouvé')).toBeInTheDocument();
    });

    test('logs when the options cannot be loaded', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(getAllUsers).mockRejectedValue(new Error('down'));

        render(<InviteCollaborator projectId="p1" ownerId="owner" />);

        await waitFor(() => expect(console.error).toHaveBeenCalled());
    });

    test('the send button is disabled until someone is selected', async () => {
        await openPanel();

        expect(screen.getByRole('button', { name: 'Send invitation' })).toBeDisabled();

        await pick('Bob');

        expect(screen.getByRole('button', { name: 'Send invitation' })).toBeEnabled();
    });

    test('invites every selected user and reports success', async () => {
        vi.mocked(inviteCollaborator).mockResolvedValue({});
        await openPanel();
        await pick('Bob');
        await pick('Carol');

        await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

        expect(await screen.findByText('Invitation sent successfully.')).toBeInTheDocument();
        expect(inviteCollaborator).toHaveBeenCalledWith('p1', 'bob');
        expect(inviteCollaborator).toHaveBeenCalledWith('p1', 'carol');
    });

    test('shows an error when an invitation fails', async () => {
        vi.mocked(inviteCollaborator).mockRejectedValue(new Error('down'));
        await openPanel();
        await pick('Bob');

        await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

        expect(
            await screen.findByText('Unable to send the invitation. Please try again.'),
        ).toBeInTheDocument();
    });

    test('cancel closes the panel and clears the selection', async () => {
        await openPanel();
        await pick('Bob');

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await waitFor(() =>
            expect(screen.queryByText('Invite a collaborator')).not.toBeInTheDocument(),
        );
        await userEvent.click(screen.getByRole('button', { name: 'Invite collaborator' }));

        expect(screen.getByRole('button', { name: 'Send invitation' })).toBeDisabled();
    });

    test('cannot be closed while sending', async () => {
        vi.mocked(inviteCollaborator).mockReturnValue(new Promise(() => {}));
        await openPanel();
        await pick('Bob');

        await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));
        await userEvent.keyboard('{Escape}');

        expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
        expect(screen.getByText('Invite a collaborator')).toBeInTheDocument();
    });
});
