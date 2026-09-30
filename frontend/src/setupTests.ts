import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// jsdom has no matchMedia; react-bootstrap's Offcanvas needs it.
if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
        ({
            matches: false,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
            onchange: null,
        }) as MediaQueryList;
}
