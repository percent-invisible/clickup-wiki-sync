import { describe, it, expect } from 'vitest';
import { MarkdownTransformer } from '../src/markdown/markdown.transformer';
import { ParsedLink, LinkType } from '../src/types';

describe('MarkdownTransformer.LOCAL_LINK_HANDLERS', () => {
    const basePath = '/base';
    const pageMapping = { p1: { path: 'page1.md', name: 'Page 1' } };
    it('handles unknown', () => {
        expect(
            MarkdownTransformer.LOCAL_LINK_HANDLERS.unknown({
                link: { type: LinkType.UNKNOWN, text: '', url: '' },
                basePath,
                pageMapping,
            }),
        ).toBeNull();
    });
    it('handles external', () => {
        expect(
            MarkdownTransformer.LOCAL_LINK_HANDLERS.external({
                link: { type: LinkType.EXTERNAL, text: '', url: 'http://x' },
                basePath,
                pageMapping,
            }),
        ).toBe('http://x');
    });
    it('handles doc', () => {
        expect(
            MarkdownTransformer.LOCAL_LINK_HANDLERS.doc({
                link: { type: LinkType.DOC, text: '', url: '', documentId: 'd' },
                basePath,
                pageMapping,
            }),
        ).toBe('/base/index.md');
        expect(
            MarkdownTransformer.LOCAL_LINK_HANDLERS.doc({
                link: { type: LinkType.DOC, text: '', url: '' },
                basePath,
                pageMapping,
            }),
        ).toBeNull();
    });
    it('handles page', () => {
        expect(
            MarkdownTransformer.LOCAL_LINK_HANDLERS.page({
                link: { type: LinkType.PAGE, text: '', url: '', pageId: 'p1' },
                basePath,
                pageMapping,
            }),
        ).toBe('page1.md');
        expect(
            MarkdownTransformer.LOCAL_LINK_HANDLERS.page({
                link: { type: LinkType.PAGE, text: '', url: '' },
                basePath,
                pageMapping,
            }),
        ).toBeNull();
    });
    it('handles linked_page', () => {
        expect(
            MarkdownTransformer.LOCAL_LINK_HANDLERS.linked_page({
                link: { type: LinkType.LINKED_PAGE, text: '', url: '', pageId: 'p1' },
                basePath,
                pageMapping,
            }),
        ).toBe('page1.md');
        expect(
            MarkdownTransformer.LOCAL_LINK_HANDLERS.linked_page({
                link: { type: LinkType.LINKED_PAGE, text: '', url: '' },
                basePath,
                pageMapping,
            }),
        ).toBeNull();
    });
});
