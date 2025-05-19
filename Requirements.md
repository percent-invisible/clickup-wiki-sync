# ClickUp Offline Wiki - Requirements

## Features

### 1. Two-Phase ClickUp Sync and Link Transformation

#### Phase 1: Page Sync and Cataloging
- Sync all ClickUp pages and write them to disk **without transforming or replacing any links**.
- For each synced page, catalog the following properties:
  - `pageId`
  - `name`
  - `clickupUrl` (excluding block references)
  - Local file path (written location)
  - `documentId` (for handling cross-document links)
  - (Add additional properties as needed to support link replacement)
- The catalog is built during this phase and will be used for link transformation.

**Implementation Details:**
- Catalog will be an in-memory structure (memory usage optimized)
- Catalog structure: multi-index Map with pageId as primary key
  ```typescript
  class PageCatalog {
    private entriesByPageId = new Map<string, PageCatalogEntry>();
    private entriesByUrl = new Map<string, PageCatalogEntry>();
    private entriesByDocId = new Map<string, PageCatalogEntry[]>();
  }
  ```
- Optional debug capability to dump catalog to file

#### Phase 2: Link Replacement Using Catalog
- Walk all written markdown files.
- For each file, use the catalog to **replace all supported markdown link patterns** (see below) with local equivalents.
- Only in this phase are links transformed; the original sync preserves all source links for reliability and traceability.

**Implementation Details:**
- Links to pages not found in catalog are left unchanged (preserving original ClickUp URL)
- Both phases run together in one seamless operation
- Cross-document links are cataloged when encountered, with documents loaded as needed

---

### 2. Supported ClickUp Link Formats
- Doc: `https://app.clickup.com/{workspace_id}/v/dc/{doc_id}`
- Page: `https://app.clickup.com/{workspace_id}/v/dc/{document_id}/{page_id}`
- Linked page: `https://app.clickup.com/{workspace_id}/docs/{document_id}/{page_id}`

**API Fields of Interest:**
- `name`
- `content` (fetch with `content_format=text%2Fmd`)
- `workspace_id`, `doc_id`, `id`, `pages` (nested tree)

**API Request Example:**
```bash
curl --request GET \
     --url 'https://api.clickup.com/api/v3/workspaces/18003214/docs/h5d8e-3374/pages?max_page_depth=-1&content_format=text%2Fmd' \
     --header 'Authorization: CLICKUP_API_KEY' \
     --header 'accept: application/json'
```

### 3. Supported Markdown Link Patterns
- `[link text](url)`
- `Text ([url](url))` (embedded links)
- `[](url)` (empty links, e.g. for computed fields)
- `[text]([text](url))` (nested markdown links)
- Markdown links in table cells: `| cell | [text](url) |`

- **Handles:**
  - Empty or whitespace-only link text (replaces with page name or fallback to link).
  - Nested and encoded links.
  - Self-referential and cross-doc links.
  - Numbered list item links.
  - Block, table cell, and field-type links (including markdown links in table cells, e.g. `| cell | [text](url) |`).
  - Embedded/nested markdown links (e.g. `[text]([text](url))`).
  - Leaves unknown/external links unchanged.
- **Not Handling:**
  - Image markdown links: `![](image_url)` (e.g. `![](https://t18003214.p.clickup-attachments.com/...)`)
  - Phone links: `[phone number](tel:phone_number)` (e.g. `[+1 (715) 111-2222](tel:+17151112222)`)
  - Task links: `[Task](https://app.clickup.com/t/xxxxxxx)`
- **Relative Path Calculation:**
  - All local links are generated relative to the current file.

### 3. Page Tree Structure
- Supports syncing nested page tree structures from the ClickUp API (`pages` property).
- Pages may act as both folders and pages; the file/folder structure mirrors ClickUp's hierarchy.
- Example structure:
  - Parent Page (page + folder)
    - Child Page (page)
    - Subfolder Page (page + folder)
      - Nested Child (page)

### 4. Configuration
- **Config Loader:**
  - Loads YAML config, supporting at least `clickup.apiKey` and `outputFolder`.
  - Throws on missing/invalid config.

### 5. Project and Build Setup
- **Tech Stack:** TypeScript project.
- **Build & Distribution:**
  - Uses `npm` as the package manager.
  - Project structure: `src` and `dist` folders.
  - Target ECMAScript version: ES2023.
  - Uses latest TypeScript version.
  - Build tool is flexible (e.g. `tsc`, `esbuild`, `vite`).

### 6. Markdown Parser
- Uses a robust, existing markdown parser (e.g. [`markdown-it`](https://github.com/markdown-it/markdown-it) or [`remark`](https://github.com/remarkjs/remark)).

### 7. Fetch & Replace Unfetched Document Links
- When encountering ClickUp links to docs/pages not yet fetched, the syncer will automatically:
  - Detect such links during markdown parsing.
  - Fetch the referenced document/page via the ClickUp API.
  - Add it to the local mapping and resume link replacement, ensuring all links resolve to local files.

### 8. Testing and Validation
- **Unit and Integration Tests:**
  - Markdown transformation (including all ClickUp link types and edge cases).
  - Link parsing (ClickUp, external, local, empty, nested, and malformed links).
  - CLI usage and error handling.
  - Syncing doc trees and file output.
  - Output directory and file structure validation.
- **Tested Scenarios:**
  - Cross-folder and nested relative link generation.
  - Handling of bad/missing names and invalid URLs.
  - Preservation of unknown/external links.

### 9. Error Handling & Logging
- **Descriptive error messages** for unsupported URLs, missing config, and file system issues.
- **Console output** for sync progress and completion.

### 10. Extensibility
- **Record-based link pattern matching and parsing.**
- **Enum-based link types and patterns** for maintainability.

---

This requirements document reflects the current implementation, including all technical details and supported features as inferred from the codebase, test suite, and ClickUp_API_Docs_Requirements.md. For API field/property specifics and URL patterns, see also `ClickUp_API_Docs_Requirements.md`.
