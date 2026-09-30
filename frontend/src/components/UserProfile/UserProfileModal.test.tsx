import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Swal from 'sweetalert2';
import UserProfileModal from './UserProfileModal';
import {
    getCurrentUser,
    updateMe,
    deleteMe,
    logout,
    downloadUserData,
} from '../../services/userApi';

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));
vi.mock('../../services/userApi', () => ({
    getCurrentUser: vi.fn(),
    updateMe: vi.fn(),
    deleteMe: vi.fn(),
    logout: vi.fn(),
    downloadUserData: vi.fn(),
}));

const user = { id: 'u1', username: 'alice', email: 'a@b.c' };

async function renderLoaded() {
    render(<UserProfileModal show onClose={vi.fn()} />);
    await screen.findByDisplayValue('alice');
}

describe('UserProfileModal', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(getCurrentUser).mockResolvedValue(user as never);
    });

    test('does not load the profile while hidden', () => {
        render(<UserProfileModal show={false} onClose={vi.fn()} />);

        expect(getCurrentUser).not.toHaveBeenCalled();
    });

    test('loads the profile into the form', async () => {
        await renderLoaded();

        expect(getCurrentUser).toHaveBeenCalled();
    });

    test('shows an error when the profile cannot be loaded', async () => {
        vi.mocked(getCurrentUser).mockRejectedValue(new Error('down'));
        render(<UserProfileModal show onClose={vi.fn()} />);

        expect(await screen.findByText('Unable to load your profile.')).toBeInTheDocument();
    });

    test('saves the new username', async () => {
        vi.mocked(updateMe).mockResolvedValue({ ...user, username: 'bob' } as never);
        await renderLoaded();

        const input = screen.getByDisplayValue('alice');
        await userEvent.clear(input);
        await userEvent.type(input, 'bob');
        await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        expect(updateMe).toHaveBeenCalledWith('bob');
        await waitFor(() => expect(screen.getByDisplayValue('bob')).toBeInTheDocument());
    });

    test('shows an error when saving fails', async () => {
        vi.mocked(updateMe).mockRejectedValue(new Error('down'));
        await renderLoaded();

        await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        expect(await screen.findByText('Unable to update your profile.')).toBeInTheDocument();
    });

    test('ignores a save before the profile has loaded', async () => {
        vi.mocked(getCurrentUser).mockRejectedValue(new Error('down'));
        render(<UserProfileModal show onClose={vi.fn()} />);
        await screen.findByText('Unable to load your profile.');

        await userEvent.type(screen.getByRole('textbox'), 'x{Enter}');

        expect(updateMe).not.toHaveBeenCalled();
    });

    test('lets the user type a password', async () => {
        await renderLoaded();

        const password = document.querySelector('input[type="password"]') as HTMLInputElement;
        await userEvent.type(password, 'secret');

        expect(password).toHaveValue('secret');
    });

    describe('delete account', () => {
        const original = window.location;

        beforeEach(() => {
            Object.defineProperty(window, 'location', {
                configurable: true,
                value: { href: '/profile' },
            });
        });

        test('deletes the account once confirmed', async () => {
            vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
            vi.mocked(deleteMe).mockResolvedValue();
            await renderLoaded();

            await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));

            await waitFor(() => expect(deleteMe).toHaveBeenCalled());
            expect(window.location.href).toBe('/');
            Object.defineProperty(window, 'location', { configurable: true, value: original });
        });

        test('keeps the account when not confirmed', async () => {
            vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
            await renderLoaded();

            await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));

            await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
            expect(deleteMe).not.toHaveBeenCalled();
        });

        test('shows an error when deletion fails', async () => {
            vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
            vi.mocked(deleteMe).mockRejectedValue(new Error('down'));
            await renderLoaded();

            await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));

            expect(await screen.findByText('Unable to delete your account.')).toBeInTheDocument();
        });
    });

    describe('logout', () => {
        test('logs out and goes home', async () => {
            Object.defineProperty(window, 'location', {
                configurable: true,
                value: { href: '/profile' },
            });
            vi.mocked(logout).mockResolvedValue();
            await renderLoaded();

            await userEvent.click(screen.getByRole('button', { name: 'Logout' }));

            await waitFor(() => expect(window.location.href).toBe('/'));
        });

        test('shows an error when logout fails', async () => {
            vi.mocked(logout).mockRejectedValue(new Error('down'));
            await renderLoaded();

            await userEvent.click(screen.getByRole('button', { name: 'Logout' }));

            expect(await screen.findByText('Unable to logout.')).toBeInTheDocument();
        });
    });

    describe('download data', () => {
        test('downloads the export as a file', async () => {
            vi.mocked(downloadUserData).mockResolvedValue(new Blob(['{}']));
            const createObjectURL = vi.fn().mockReturnValue('blob:x');
            Object.defineProperty(window.URL, 'createObjectURL', {
                configurable: true,
                value: createObjectURL,
            });
            const click = vi
                .spyOn(HTMLAnchorElement.prototype, 'click')
                .mockImplementation(() => {});
            await renderLoaded();

            await userEvent.click(screen.getByRole('button', { name: 'Download my data' }));

            await waitFor(() => expect(click).toHaveBeenCalled());
            expect(createObjectURL).toHaveBeenCalled();
        });

        test('shows an error when the download fails', async () => {
            vi.mocked(downloadUserData).mockRejectedValue(new Error('down'));
            await renderLoaded();

            await userEvent.click(screen.getByRole('button', { name: 'Download my data' }));

            expect(await screen.findByText('Unable to download your data.')).toBeInTheDocument();
        });
    });
});
