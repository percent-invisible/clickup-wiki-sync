import { describe, it, expect } from 'vitest';
import { LINK_PATTERNS } from '../src/markdown/link-patterns.const';

describe('LINK_PATTERNS', () => {
    it('matches doc url', () => {
        const match = LINK_PATTERNS.DOC.regex.exec('https://app.clickup.com/123/v/dc/abc');
        expect(match).not.toBeNull();
        expect(match![1]).toBe('123');
        expect(match![2]).toBe('abc');
    });
    it('matches page url', () => {
        const match = LINK_PATTERNS.PAGE.regex.exec('https://app.clickup.com/123/v/dc/abc/def');
        expect(match).not.toBeNull();
        expect(match![1]).toBe('123');
        expect(match![2]).toBe('abc');
        expect(match![3]).toBe('def');
    });
    it('matches linked page url', () => {
        const match = LINK_PATTERNS.LINKED_PAGE.regex.exec('https://app.clickup.com/123/docs/abc/def');
        expect(match).not.toBeNull();
        expect(match![1]).toBe('123');
        expect(match![2]).toBe('abc');
        expect(match![3]).toBe('def');
    });
});
