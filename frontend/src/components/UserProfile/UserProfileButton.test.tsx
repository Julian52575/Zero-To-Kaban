import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfileButton from './UserProfileButton';

vi.mock('./UserProfileModal', () => ({
    default: ({ show, onClose }: { show: boolean; onClose: () => void }) =>
        show ? <button onClick={onClose}>close-modal</button> : null,
}));

describe('UserProfileButton', () => {
    test('opens and closes the profile modal', async () => {
        render(<UserProfileButton />);
        expect(screen.queryByText('close-modal')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Profile' }));
        expect(screen.getByText('close-modal')).toBeInTheDocument();

        await userEvent.click(screen.getByText('close-modal'));
        expect(screen.queryByText('close-modal')).not.toBeInTheDocument();
    });
});
