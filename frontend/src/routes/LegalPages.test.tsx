import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LegalNotice from './LegalNotice';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfUse from './TermsOfUse';

describe('legal pages', () => {
    test.each([
        ['Legal Notice', LegalNotice],
        ['Privacy Policy', PrivacyPolicy],
        ['Terms of Use', TermsOfUse],
    ])('%s renders its heading', (heading, Page) => {
        render(<Page />);

        expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    });
});
