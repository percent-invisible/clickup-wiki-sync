import { describe, it, expect, beforeEach } from 'vitest';
import { LinkTransformer } from '../../src/link/link-transformer.class';
import { PageMapping } from '../../src/catalog/types';

describe('LinkTransformer', () => {
    let transformer: LinkTransformer;
    let pageMapping: PageMapping;
    
    beforeEach(() => {
        transformer = new LinkTransformer();
        
        // Set up a mock page mapping
        pageMapping = {
            'page-123': {
                path: '/wiki/doc-abc/page-123.md',
                name: 'Test Page'
            },
            'page-456': {
                path: '/wiki/doc-abc/subfolder/page-456.md',
                name: 'Another Page'
            },
            'doc-abc': {
                path: '/wiki/doc-abc/index.md',
                name: 'Test Document'
            },
            'https://app.clickup.com/12345/v/dc/abc-123/page-123': {
                path: '/wiki/doc-abc/page-123.md',
                name: 'Test Page'
            }
        };
    });
    
    describe('transform', () => {
        it('should transform standard markdown links correctly', async () => {
            const content = 'This is a [link](https://app.clickup.com/12345/v/dc/abc-123/page-123) to a page.';
            const currentFilePath = '/wiki/doc-def/some-page.md';
            
            const result = await transformer.transform({
                content,
                pageMapping,
                currentFilePath
            });
            
            expect(result).toEqual('This is a [link](../doc-abc/page-123.md) to a page.');
        });
        
        it('should preserve formatting in link text', async () => {
            const content = 'This is a [**bold link**](https://app.clickup.com/12345/v/dc/abc-123/page-123) to a page.';
            const currentFilePath = '/wiki/doc-def/some-page.md';
            
            const result = await transformer.transform({
                content,
                pageMapping,
                currentFilePath
            });
            
            expect(result).toEqual('This is a [**bold link**](../doc-abc/page-123.md) to a page.');
        });
        
        it('should provide empty links with the page name', async () => {
            const content = 'This is a [](https://app.clickup.com/12345/v/dc/abc-123/page-123) link with empty text.';
            const currentFilePath = '/wiki/doc-def/some-page.md';
            
            const result = await transformer.transform({
                content,
                pageMapping,
                currentFilePath,
                diagnoseLinks: true
            });
            
            // We need to check the replaced links data
            expect(typeof result).not.toBe('string');
            if (typeof result !== 'string') {
                expect(result.replacedLinks[0].newText).toBe('Test Page');
            }
        });
        
        it('should calculate relative paths correctly', async () => {
            const content = 'Link to [page](https://app.clickup.com/12345/v/dc/abc-123/page-456) in subfolder.';
            const currentFilePath = '/wiki/doc-abc/page-123.md';
            
            const result = await transformer.transform({
                content,
                pageMapping,
                currentFilePath
            });
            
            expect(result).toEqual('Link to [page](./subfolder/page-456.md) in subfolder.');
        });
        
        it('should handle multiple links in the same content', async () => {
            const content = 'This has [link1](https://app.clickup.com/12345/v/dc/abc-123/page-123) and ' +
                           '[link2](https://app.clickup.com/12345/v/dc/abc-123/page-456) in the same text.';
            const currentFilePath = '/wiki/doc-def/some-page.md';
            
            const result = await transformer.transform({
                content,
                pageMapping,
                currentFilePath
            });
            
            expect(result).toContain('[link1](../doc-abc/page-123.md)');
            expect(result).toContain('[link2](../doc-abc/subfolder/page-456.md)');
        });
        
        it('should not transform external links', async () => {
            const content = 'This is an [external link](https://example.com) to another website.';
            const currentFilePath = '/wiki/doc-abc/page-123.md';
            
            const result = await transformer.transform({
                content,
                pageMapping,
                currentFilePath
            });
            
            expect(result).toEqual('This is an [external link](https://example.com) to another website.');
        });
        
        it('should return diagnostics when requested', async () => {
            const content = 'This is a [link](https://app.clickup.com/12345/v/dc/abc-123/page-123) to a page.';
            const currentFilePath = '/wiki/doc-def/some-page.md';
            
            const result = await transformer.transform({
                content,
                pageMapping,
                currentFilePath,
                diagnoseLinks: true
            });
            
            expect(typeof result).not.toBe('string');
            if (typeof result !== 'string') {
                expect(result.transformedContent).toEqual('This is a [link](../doc-abc/page-123.md) to a page.');
                expect(result.replacedLinks).toHaveLength(1);
                expect(result.replacedLinks[0].originalUrl).toEqual('https://app.clickup.com/12345/v/dc/abc-123/page-123');
                expect(result.replacedLinks[0].localLink).toContain('../doc-abc/page-123.md');
            }
        });
    });
});
