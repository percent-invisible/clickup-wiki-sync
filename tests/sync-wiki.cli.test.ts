import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

const CLI_PATH = path.join(__dirname, '../src/cli/sync-wiki-cli.class.ts');
const TEMP_DIST = path.join(__dirname, 'tmp_cli_dist');

// Minimal mock for ClickUpSyncer and SyncWiki are not required since the CLI uses real implementation.
// We'll use a simple ts-node invocation and a local mock server pattern if needed.

describe('sync-wiki.cli.ts', () => {
    beforeEach(async () => {
        await fs.rm(TEMP_DIST, { recursive: true, force: true });
    });
    afterEach(async () => {
        await fs.rm(TEMP_DIST, { recursive: true, force: true });
    });

    it('prints usage and exits if no URL is provided', async () => {
        await new Promise<void>((resolve, reject) => {
            const child = execFile('ts-node', [CLI_PATH], (error, stdout, stderr) => {
                try {
                    const usageMsg = 'Usage: ts-node src/cli/sync-wiki-cli.class.ts <ClickUp URL>';
                    if (!stdout.includes(usageMsg) && !stderr.includes(usageMsg)) {
                        console.error('stdout:', stdout);
                        console.error('stderr:', stderr);
                    }
                    expect(stdout + stderr).toContain(usageMsg);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        });
    }, 15000);

    // Note: Full integration test with real ClickUp API would require credentials and network access.
    // For now, this test ensures the CLI entrypoint and error handling are correct.
});
