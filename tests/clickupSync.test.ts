import { describe, it, expect, vi } from 'vitest';
import { ClickUpSyncer } from '../src/clickup-syncer.class';
import { ClickUpUrlParser } from '../src/clickup-url-parser.class';
import { ClickUpAPI } from '../src/api/clickup-api.class';

describe('ClickUpUrlParser', () => {
    it('parses doc url', () => {
        const url = 'https://app.clickup.com/123/v/dc/abc';
        const parsed = ClickUpUrlParser.parse({ url });
        expect(parsed).toMatchObject({
            type: expect.any(String),
            workspaceId: '123',
            documentId: 'abc',
            url
        });
    });
    it('parses page url', () => {
        const url = 'https://app.clickup.com/123/v/dc/abc/def';
        const parsed = ClickUpUrlParser.parse({ url });
        expect(parsed).toMatchObject({
            type: expect.any(String),
            workspaceId: '123',
            documentId: 'abc',
            pageId: 'def',
            url
        });
    });
    it('parses linked page url', () => {
        const url = 'https://app.clickup.com/123/docs/abc/def';
        const parsed = ClickUpUrlParser.parse({ url });
        expect(parsed).toMatchObject({
            type: expect.any(String),
            workspaceId: '123',
            documentId: 'abc',
            pageId: 'def',
            url
        });
    });
    it('returns null for invalid url', () => {
        expect(ClickUpUrlParser.parse({ url: 'https://google.com' })).toBeNull();
    });
});

describe('ClickUpSyncer', () => {
    it('throws for unsupported url', async () => {
        await expect(ClickUpSyncer.sync({ url: 'https://google.com' })).rejects.toThrow();
    });
    it('calls ClickUpAPI.getDocument', async () => {
        const mockGetDoc = vi.fn().mockResolvedValue({ fake: 'doc' });
        const mockGetPage = vi.fn().mockResolvedValue({ fake: 'page' });
        const getDocSpy = vi.spyOn(ClickUpAPI.prototype, 'getDocument').mockImplementation(mockGetDoc);
        const getPageSpy = vi.spyOn(ClickUpAPI.prototype, 'getPage').mockImplementation(mockGetPage);
        try {
            await ClickUpSyncer.sync({ url: 'https://app.clickup.com/123/v/dc/abc/def' });
            expect(mockGetDoc).toHaveBeenCalled();
            expect(mockGetPage).not.toHaveBeenCalled();
        } finally {
            getDocSpy.mockRestore();
            getPageSpy.mockRestore();
        }
    });
});
