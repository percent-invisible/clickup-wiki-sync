import { describe, it, expect } from 'vitest';
import { LOCAL_LINK_HANDLERS } from '../src/markdown/local-link-handlers.const';
import { ParsedLink, LinkType } from '../src/types';

describe('LOCAL_LINK_HANDLERS', () => {
    const basePath = '/base';
    const pageMapping = { 'p1': 'page1.md' };
    it('handles unknown', () => {
        expect(LOCAL_LINK_HANDLERS.unknown({ link: { type: LinkType.UNKNOWN, text: '', url: '' }, basePath, pageMapping })).toBeNull();
    });
    it('handles external', () => {
        expect(LOCAL_LINK_HANDLERS.external({ link: { type: LinkType.EXTERNAL, text: '', url: 'http://x' }, basePath, pageMapping })).toBe('http://x');
    });
    it('handles doc', () => {
        expect(LOCAL_LINK_HANDLERS.doc({ link: { type: LinkType.DOC, text: '', url: '', documentId: 'd' }, basePath, pageMapping })).toBe('/base/index.md');
        expect(LOCAL_LINK_HANDLERS.doc({ link: { type: LinkType.DOC, text: '', url: '' }, basePath, pageMapping })).toBeNull();
    });
    it('handles page', () => {
        expect(LOCAL_LINK_HANDLERS.page({ link: { type: LinkType.PAGE, text: '', url: '', pageId: 'p1' }, basePath, pageMapping })).toBe('page1.md');
        expect(LOCAL_LINK_HANDLERS.page({ link: { type: LinkType.PAGE, text: '', url: '' }, basePath, pageMapping })).toBeNull();
    });
    it('handles linked_page', () => {
        expect(LOCAL_LINK_HANDLERS.linked_page({ link: { type: LinkType.LINKED_PAGE, text: '', url: '', pageId: 'p1' }, basePath, pageMapping })).toBe('page1.md');
        expect(LOCAL_LINK_HANDLERS.linked_page({ link: { type: LinkType.LINKED_PAGE, text: '', url: '' }, basePath, pageMapping })).toBeNull();
    });
});
