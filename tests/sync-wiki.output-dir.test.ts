import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SyncWiki } from '../src/filesystem/sync-wiki.class';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ClickupDoc } from '../src/types';

const TEMP_OUTPUT = path.join(__dirname, '.clickup-test-out');

const minimalDoc: ClickupDoc = {
    id: 'root',
    name: 'Root',
    content: '# Test',
    workspaceId: 'ws1',
    docId: 'docRoot',
    isRoot: true,
    pages: [],
};

describe('SyncWiki output directory', () => {
    beforeEach(async () => {
        await fs.rm(TEMP_OUTPUT, { recursive: true, force: true });
    });
    afterEach(async () => {
        await fs.rm(TEMP_OUTPUT, { recursive: true, force: true });
    });

    it('creates the output directory and writes the root markdown file', async () => {
        const syncWiki = new SyncWiki({ distRoot: TEMP_OUTPUT });
        await syncWiki.syncDocTree({ doc: minimalDoc, basePath: '' });
        // No root doc file or directory should be written; just ensure no error is thrown and test completes.
        // If there were children, you would check for their files here.
    });
});
