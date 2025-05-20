# ClickUp Offline Wiki

A TypeScript-based tool that syncs ClickUp documentation to your local filesystem, creating an offline-accessible wiki with proper linking between pages.

## Features

- Downloads ClickUp documents and pages via the API
- Preserves nested page structure as folders
- Converts ClickUp links to local filesystem links with WYSIWYG preservation
- Handles various link patterns including cross-document references
- Maintains a local, browsable wiki structure
- Automatic discovery and syncing of referenced documents

## Installation

```bash
npm install
npm run build
```

## Usage

### CLI

```bash
# Sync a document from its URL
npm run sync-wiki -- --url https://app.clickup.com/{workspace_id}/v/dc/{doc_id} --key YOUR_CLICKUP_API_KEY --output ./wiki

# Show help
npm run cli -- sync --help
```

### API

```typescript
import { ClickupWikiSyncer } from 'clickup-offline-wiki';

// Create a syncer instance
const syncer = new ClickupWikiSyncer({
  apiKey: 'YOUR_CLICKUP_API_KEY',
  outputDir: './wiki',
  maxDepth: 3, // Optional: max depth for recursive document fetching
  debug: false // Optional: enable debug output
});

// Sync a document from its URL
await syncer.run({
  url: 'https://app.clickup.com/{workspace_id}/v/dc/{doc_id}'
});
```

## Requirements

- Node.js 16 or later
- ClickUp API key
- ClickUp workspace and document IDs

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```