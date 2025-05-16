import { ClickUpSyncer } from '../utils/clickup-syncer.class';
import { SyncWiki } from '../filesystem/sync-wiki.class';
import { resolve } from 'path';
import { ConfigLoader } from '../config/config.loader';

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
        
        
        // Write direct diagnostic file with top-level doc structure
        const fs = require('fs').promises;
        const diagnosticsDir = resolve(outputFolder, '_diagnostics');
        await fs.mkdir(diagnosticsDir, { recursive: true });
        
        // Save the raw doc structure
        await fs.writeFile(
            resolve(diagnosticsDir, 'doc-structure.json'),
            JSON.stringify(doc, null, 2),
            'utf-8'
        );
        
        // Create a manual structure file to verify top-level pages
        let manualStructure = `# Document: ${doc.name}\n\n`;
        manualStructure += `ID: ${doc.id}\n\n`;
        manualStructure += `Has content: ${!!doc.content}\n\n`;
        
        if (doc.pages && Array.isArray(doc.pages)) {
            manualStructure += `## Child Pages (${doc.pages.length})\n\n`;
            for (const page of doc.pages) {
                manualStructure += `- ${page.name} (ID: ${page.id}, Has content: ${!!page.content})\n`;
                if (page.pages && Array.isArray(page.pages) && page.pages.length > 0) {
                    manualStructure += `  - Has ${page.pages.length} subpages\n`;
                }
            }
        } else {
            manualStructure += `No child pages found or pages is not an array.\n`;
        }
        
        await fs.writeFile(
            resolve(diagnosticsDir, 'manual-structure.md'),
            manualStructure,
            'utf-8'
        );
        
        
        // 2. Write to local wiki using existing syncer
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
