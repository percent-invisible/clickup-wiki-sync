import { ClickupSyncWiki } from '../sync/clickup-sync-wiki.class';

/**
 * CLI entrypoint for syncing ClickUp docs/pages to local wiki.
 * Usage: ts-node src/cli/clickup-sync-wiki-cli.class.ts <ClickUp URL>
 */
export class ClickupSyncWikiCli {
    public static printUsage(): string {
        const msg = 'Usage: ts-node src/cli/clickup-sync-wiki-cli.class.ts <ClickUp URL>\n';
        process.stderr.write(msg);
        return msg;
    }

    public static async run(options: { url?: string } = {}): Promise<void> {
        const { url = process.argv[2] } = options;
        
        if (!url) {
            this.printUsage();
            process.exit(1);
        }

        try {
            await ClickupSyncWiki.run({ url });
            console.log('Sync complete!');
        } catch (err) {
            console.error('Sync failed:', err);
            process.exit(1);
        }
    }
}

if (require.main === module) {
    ClickupSyncWikiCli.run();
}
