import { Command } from 'commander';
import { ClickupWikiSyncer } from '../sync/clickup-wiki-syncer.class';
import { ConfigLoader } from '../config/config-loader.class';

/**
 * Command-line interface for the ClickUp Offline Wiki.
 * 
 * Provides a simple CLI for syncing ClickUp documents to local markdown files.
 */
export class ClickupWikiCLI {
    /**
     * The command-line program.
     */
    private readonly program: Command;

    /**
     * Creates a new CLI instance.
     */
    constructor() {
        this.program = new Command();
        this.setupProgram();
    }

    /**
     * Configures the CLI program with commands and options.
     */
    private setupProgram(): void {
        this.program
            .name('clickup-wiki')
            .description('Sync ClickUp documents to a local offline wiki')
            .version('1.0.0');

        this.program
            .command('sync')
            .description('Sync a ClickUp document to local markdown files')
            .requiredOption('-u, --url <url>', 'ClickUp document URL')
            .option('-c, --config <path>', 'Path to config file', 'config.yml')
            .option('-k, --key <key>', 'ClickUp API key (overrides config file)')
            .option('-o, --output <dir>', 'Output directory (overrides config file)')
            .option('-d, --depth <number>', 'Maximum depth for cross-document references (overrides config file)')
            .option('--debug', 'Enable debug output (overrides config file)', false)
            .action(async (options: {
                url: string;
                config: string;
                key?: string;
                output?: string;
                depth?: string;
                debug: boolean;
            }) => {
                try {
                    // Prepare overrides from command line arguments
                    const overrides: Record<string, any> = {};
                    
                    if (options.key) {
                        overrides.apiKey = options.key;
                    }
                    
                    if (options.output) {
                        overrides.outputPath = options.output;
                    }
                    
                    if (options.depth) {
                        overrides.maxPageFetchDepth = parseInt(options.depth, 10);
                    }
                    
                    if (options.debug !== undefined) {
                        overrides.debug = options.debug;
                    }
                    
                    // Load configuration from file with CLI overrides
                    const config = ConfigLoader.load({
                        configPath: options.config,
                        overrides,
                    });
                    
                    // Create syncer with loaded configuration
                    const syncer = new ClickupWikiSyncer({
                        apiKey: config.apiKey,
                        outputDir: config.outputPath,
                        maxDepth: config.maxPageFetchDepth,
                        debug: config.debug,
                    });

                    await syncer.run({ url: options.url });
                    
                    console.log('Wiki sync completed successfully!');
                    console.log(`Output directory: ${config.outputPath}`);
                } catch (error) {
                    console.error('Wiki sync failed:', error);
                    process.exit(1);
                }
            });
    }

    /**
     * Parses command-line arguments and runs the program.
     */
    public async run(options: { args?: string[] } = {}): Promise<void> {
        try {
            await this.program.parseAsync(options.args || process.argv);
        } catch (error) {
            console.error('CLI execution failed:', error);
            process.exit(1);
        }
    }
}
