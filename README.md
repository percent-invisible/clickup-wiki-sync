# ClickUp Offline Wiki

A TypeScript-based tool that syncs ClickUp documentation to your local filesystem, creating an offline-accessible wiki with proper linking between pages.

## Features

- Downloads ClickUp documents and pages via the API
- Preserves nested page structure as folders
- Converts ClickUp links to local filesystem links
- Handles various Markdown link patterns
- Maintains a local, browsable wiki structure

## Installation

```bash
npm install clickup-offline-wiki
```

## Usage

```typescript
import { syncClickUpWiki } from 'clickup-offline-wiki';

// Sync a specific document and all its pages
await syncClickUpWiki({
  apiKey: 'YOUR_CLICKUP_API_KEY',
  workspaceId: 'YOUR_WORKSPACE_ID',
  documentId: 'YOUR_DOCUMENT_ID',
  outputDir: './wiki'
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