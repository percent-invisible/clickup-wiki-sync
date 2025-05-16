import { ClickUpSyncer } from '../clickup-syncer.class';
import { SyncWiki } from '../filesystem/sync-wiki.class';
import { resolve } from 'path';
import { ConfigLoader } from '../config-loader.class';

/**
 * CLI entrypoint for syncing ClickUp docs/pages to local wiki.
 * Usage: ts-node src/cli/sync-wiki-cli.class.ts <ClickUp URL>
 */
export class SyncWikiCli {
    public static printUsage(): string {
        const msg = 'Usage: ts-node src/cli/sync-wiki-cli.class.ts <ClickUp URL>\n';
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
            // Load YAML config from default path
            const config = ConfigLoader.load({});
            // Use outputFolder from config, or default to '.clickup'
            const outputFolder = config.outputFolder || '.clickup';
        
            // 1. Fetch doc tree from ClickUp
            const doc = await ClickUpSyncer.sync({ url });
            
            // 1. Write to local wiki using existing syncer
            const syncWiki = new SyncWiki({ distRoot: resolve(outputFolder) });
            await syncWiki.syncDocTree({ doc, basePath: '' });
            console.log('Sync complete!');
        } catch (err) {
            console.error('Sync failed:', err);
            process.exit(1);
        }
    }
}

if (require.main === module) {
    SyncWikiCli.run();
}
