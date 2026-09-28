import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import Accessibility from './Accessibility';

describe('Accessibility page a11y', () => {
    test('has no detectable accessibility violations', async () => {
        const { container } = render(<Accessibility />);

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
