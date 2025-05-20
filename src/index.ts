#!/usr/bin/env node
import { ClickupWikiCLI } from './cli/clickup-wiki-cli.class';

/**
 * Application entry point.
 * 
 * Starts the CLI and handles any uncaught errors.
 */
async function main(): Promise<void> {
    try {
        const cli = new ClickupWikiCLI();
        await cli.run();
    } catch (error) {
        console.error('Application error:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    process.exit(1);
});

// Run the application
main().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
