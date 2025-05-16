import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncWiki } from '../src/filesystem/sync-wiki.class';
import { ClickupDoc } from '../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

const TEMP_DIST = path.join(__dirname, 'tmp_dist');

const mockDoc: ClickupDoc = {
    id: 'root',
    name: 'Root Doc',
    content: '# Root Content',
    workspaceId: 'ws1',
    docId: 'docRoot',
    isRoot: true,
    pages: [
        {
            id: 'child1',
            name: 'Child Page 1',
            content: 'Content 1',
            workspaceId: 'ws1',
            docId: 'docRoot',
            pages: []
        },
        {
            id: 'child2',
            name: 'Child Page 2',
            content: 'Content 2',
            workspaceId: 'ws1',
            docId: 'docRoot',
            pages: [
                {
                    id: 'grandchild',
                    name: 'Grandchild',
                    content: 'Grandchild Content',
                    workspaceId: 'ws1',
                    docId: 'docRoot',
                    pages: []
                }
            ]
        }
    ]
};

describe('SyncWiki', () => {
    beforeEach(async () => {
        await fs.rm(TEMP_DIST, { recursive: true, force: true });
    });
    afterEach(async () => {
        await fs.rm(TEMP_DIST, { recursive: true, force: true });
    });

    it('syncs a simple ClickUp doc tree to the filesystem', async () => {
        const syncWiki = new SyncWiki({ distRoot: TEMP_DIST });
        await syncWiki.syncDocTree({ doc: mockDoc, basePath: '' });

        // Child 1 file
        const child1File = path.join(TEMP_DIST, 'Root_Doc', 'Child_Page_1.md');
        const child1Content = await fs.readFile(child1File, 'utf-8');
        expect(child1Content).toContain('Content 1');

        // Child 2 file (now inside its own folder)
        const child2File = path.join(TEMP_DIST, 'Root_Doc', 'Child_Page_2', 'Child_Page_2.md');
        const child2Content = await fs.readFile(child2File, 'utf-8');
        expect(child2Content).toContain('Content 2');

        // Grandchild file
        const grandchildFile = path.join(TEMP_DIST, 'Root_Doc', 'Child_Page_2', 'Grandchild.md');
        const grandchildContent = await fs.readFile(grandchildFile, 'utf-8');
        expect(grandchildContent).toContain('Grandchild Content');
    });

    it('throws an error if node.name is undefined', async () => {
        const syncWiki = new SyncWiki({ distRoot: TEMP_DIST });
        const badDoc = {
            ...mockDoc,
            pages: [
                {
                    id: 'badchild',
                    // name intentionally omitted
                    content: 'Oops',
                    workspaceId: 'ws1',
                    docId: 'docRoot',
                    pages: []
                }
            ]
        } as any;
        await expect(syncWiki.syncDocTree({ doc: badDoc, basePath: '' }))
            .rejects
            .toThrow(/node\.name is invalid|invalid name/i);
    });
});
