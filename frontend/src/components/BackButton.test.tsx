import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackButton from './BackButton';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

describe('BackButton', () => {
    test('goes back in the history when clicked', async () => {
        render(<BackButton />);

        await userEvent.click(screen.getByRole('button', { name: 'Go back' }));

        expect(navigate).toHaveBeenCalledWith(-1);
    });
});
