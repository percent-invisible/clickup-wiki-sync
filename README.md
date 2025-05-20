# ClickUp Offline Wiki

A TypeScript-based tool that syncs ClickUp documentation to your local filesystem, creating an offline-accessible wiki with proper linking between pages.

## Features
- Downloads ClickUp documents and pages via the API
- Preserves nested page structure as folders
- Converts ClickUp links to local filesystem links with WYSIWYG preservation
- Handles various link patterns including cross-document references
- Maintains a local, browsable wiki structure
- Automatic discovery and syncing of referenced documents

---

## Installation (Tarball or GitHub Release)

1. **Download the tarball** (`.tgz`) from your GitHub release or build it locally:
   ```bash
   npm pack
   # or download from: https://github.com/yourusername/clickup-offline-wiki/releases
   ```
2. **Install into your project:**
   ```bash
   npm install /path/to/clickup-offline-wiki-<version>.tgz
   # or
   npm install https://github.com/yourusername/clickup-offline-wiki/releases/download/vX.Y.Z/clickup-offline-wiki-X.Y.Z.tgz
   ```

---

## Usage

### 1. Run by specifying all arguments

Add a script to your target project's `package.json`:
```json
"scripts": {
  "sync-wiki": "clickup-wiki-sync --url https://app.clickup.com/{workspace_id}/v/dc/{doc_id} --key YOUR_CLICKUP_API_KEY --output ./.clickup --maxDepth 3 --debug false"
}
```
Run:
```bash
npm run sync-wiki
```

### 2. Run by pointing at a config.yml file

Create a `config.yml` in your project root:
```yaml
clickup:
  apiKey: YOUR_CLICKUP_API_KEY
  outputPath: ./.clickup
  maxPageFetchDepth: 3
  debug: false
```
Add a script:
```json
"scripts": {
  "sync-wiki": "clickup-wiki-sync --config ./config.yml --url https://app.clickup.com/{workspace_id}/v/dc/{doc_id}"
}
```
Run:
```bash
npm run sync-wiki
```

### 3. CLI Arguments

You can override any config value via CLI args:
```bash
clickup-wiki-sync --url <doc_url> --key <api_key> --output <output_dir> --maxDepth <number> --debug <true|false> --config <config.yml>
```

---

## Configuration Options

| Option              | CLI Flag      | YAML Key              | Type      | Description                                      | Required |
|---------------------|---------------|-----------------------|-----------|--------------------------------------------------|----------|
| ClickUp API Key     | `--key`       | `apiKey`              | string    | Your ClickUp API key                             | Yes      |
| Document URL        | `--url`       | N/A                   | string    | The ClickUp doc/page URL to sync                 | Yes      |
| Output Directory    | `--output`    | `outputPath`          | string    | Where to write the wiki files                    | Yes      |
| Max Page Fetch Depth| `--maxDepth`  | `maxPageFetchDepth`   | number    | How deep to recurse pages (-1 = unlimited)       | No       |
| Debug Logging       | `--debug`     | `debug`               | boolean   | Enable verbose logging                           | No       |
| Config File         | `--config`    | N/A                   | string    | Path to YAML config file                         | No       |

---

## Development & Testing

```bash
# Install dependencies
npm install

# Build the CLI for production
npm run build

# Run all tests
npm test

# Run in development mode (auto-rebuild on changes)
npm run dev

# Clean build output
npm run clean
```

- **Testing:** Uses [Vitest](https://vitest.dev/) for unit tests. Add tests in the `tests/` directory.
- **Linting/Formatting:** Follow project standards and run lint/format tools as appropriate.

---

## License

MIT or your preferred license.