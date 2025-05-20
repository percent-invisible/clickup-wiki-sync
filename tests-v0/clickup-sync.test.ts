import { describe, it, expect, vi } from 'vitest';
import { ClickUpUrlParser } from '../src/utils/clickup-url-parser.class';
import { ClickUpAPI } from '../src/api/clickup-api.class';
import { ClickupSyncWiki } from '../src/sync/clickup-sync-wiki.class';

// Mock SyncWiki.syncDocTree to avoid file system operations
vi.mock('../src/filesystem/sync-wiki.class', () => ({
    SyncWiki: class {
        constructor() {
            /* empty */
        }
        syncDocTree() {
            return Promise.resolve({
                pageMapping: {},
                docPath: '.clickup-test/doc-folder',
            });
        }
    },
}));

// Mock config loader to avoid file system operations
vi.mock('../src/config/config.loader', () => ({
    ConfigLoader: {
        load: () => ({
            clickup: { apiKey: 'test-api-key' },
            outputFolder: '.clickup-test',
        }),
    },
}));

describe('ClickUpUrlParser', () => {
    it('parses doc url', () => {
        const url = 'https://app.clickup.com/123/v/dc/abc';
        const parsed = ClickUpUrlParser.parse({ url, text: 'abc' });
        expect(parsed).toMatchObject({
            type: expect.any(String),
            workspaceId: '123',
            documentId: 'abc',
            url,
        });
    });
    it('parses page url', () => {
        const url = 'https://app.clickup.com/123/v/dc/abc/def';
        const parsed = ClickUpUrlParser.parse({ url, text: 'def' });
        expect(parsed).toMatchObject({
            type: expect.any(String),
            workspaceId: '123',
            documentId: 'abc',
            pageId: 'def',
            url,
        });
    });
    it('parses linked page url', () => {
        const url = 'https://app.clickup.com/123/docs/abc/def';
        const parsed = ClickUpUrlParser.parse({ url, text: 'def' });
        expect(parsed).toMatchObject({
            type: expect.any(String),
            workspaceId: '123',
            documentId: 'abc',
            pageId: 'def',
            url,
        });
    });
    it('returns null for invalid url', () => {
        expect(ClickUpUrlParser.parse({ url: 'https://google.com', text: 'google' })).toBeNull();
    });
});

describe('ClickupSyncWiki', () => {
    it('throws for unsupported url', async () => {
        await expect(ClickupSyncWiki.run({ url: 'https://google.com' })).rejects.toThrow();
    });
    it('calls ClickUpAPI.getDocument', async () => {
        const mockGetDoc = vi.fn().mockResolvedValue({ id: 'abc', fake: 'doc' });
        const mockGetPage = vi.fn().mockResolvedValue({ fake: 'page' });
        const getDocSpy = vi.spyOn(ClickUpAPI.prototype, 'getDocument').mockImplementation(mockGetDoc);
        const getPageSpy = vi.spyOn(ClickUpAPI.prototype, 'getPage').mockImplementation(mockGetPage);

        try {
            await ClickupSyncWiki.run({ url: 'https://app.clickup.com/123/v/dc/abc/def' });
            expect(mockGetDoc).toHaveBeenCalled();
            expect(mockGetPage).not.toHaveBeenCalled();
        } finally {
            getDocSpy.mockRestore();
            getPageSpy.mockRestore();
            vi.restoreAllMocks();
        }
    });
});
