
# ClickUp API Document Syncer - Requirements and Notes

---

## 1. ClickUp Links Formats

- Doc link:  
  `https://app.clickup.com/{workspace_id}/v/dc/{doc_id}`

- Page link:  
  `https://app.clickup.com/{workspace_id}/v/dc/{document_id}/{page_id}`

- Linked page link:  
  `https://app.clickup.com/{workspace_id}/docs/{document_id}/{page_id}`

---

## 2. API Response Properties of Interest

- `name`
- `content` (use `content_format=text%2Fmd` when fetching a document)
- `workspace_id`
- `doc_id`
- `id`
- `pages` (nested page tree structure)

---

## 3. API Request Example

```bash
curl --request GET \
     --url 'https://api.clickup.com/api/v3/workspaces/18003214/docs/h5d8e-3374/pages?max_page_depth=-1&content_format=text%2Fmd' \
     --header 'Authorization: CLICKUP_API_KEY' \
     --header 'accept: application/json'
```

---

## 4. Markdown URL Patterns

### Allowed

- **Regular Markdown Links:**  
  `[link text](url)`  
  Example:  
  `[Select Field](https://app.clickup.com/18003214/v/dc/h5d8e-3194/h5d8e-17314)`

- **Empty Markdown Links (for computed fields):**  
  `[](url)`  
  Example:  
  `[](../../1.ARC-Find-A-Church-Map.md)`

- **Nested Markdown Links:**  
  `[text]([text](url))`  
  These are less common but appear in some complex formatting scenarios.

- **Markdown Links in Table Cells:**  
  `| cell | [text](url) |`  
  Example:  
  `| Field Type | Status Indicator ([Status Indicator](../../../../Field-Types-Glossary/requirements/Display-Fields/8.Status-Indicator.md)) |`

### Not Handling

- Image Markdown Links:  
  `![](image_url)`  
  Example:  
  `![](https://t18003214.p.clickup-attachments.com/t18003214/ccff9171-44d8-4dd4-9c18-0a6974221409/image.png)`

- Phone Links:  
  `[phone number](tel:phone_number)`  
  Example:  
  `[+1 (715) 111-2222](tel:+17151112222)`

- Task Links:  
  Example:  
  `[HUB: Church - ARC Find-A-Church Map Calculated Status](https://app.clickup.com/t/86b2t0yxc)`

---

## 5. Page Tree Structure Requirement

- The API response includes a nested `pages` tree structure.
- Pages may act as folders; in that case, create them as both a page and a folder.
- Example structure from existing data:

```
- ARC Find-A-Church Map (page + folder)
  - Agreements (page)
  - The Workflow Card (page + folder)
    - Fields (page + folder)
      - Status (page)
      - Agreement Start Date (page)
      - Agreement Age (page)
      - Form Last Sent (page)
      - Form Response Accepted (page)
      - Notes (page)
    - Activity Feed Items (page + folder)
      - HUB: Church Activity - ARC Find-A-Church Map Form Sent (page)
      - HUB: Church Activity - ARC Find-A-Church Map Form Unsent (page)
      - HUB: Church Activity - ARC Find-A-Church Map Form Accepted (page)
      - HUB: Church Activity - ARC Find-A-Church Map Form Rejected (page)
      - HUB: Church Activity - ARC Find-A-Church Map Status Override Changed (page)
      - HUB: Church Activity - ARC Find-A-Church Map Status Override Removed (page)
  - Data Backfill (page)
  - Status Override (page)
  - HUB: Church - ARC Health Plan (page)
  - HUB: Campus - Remove Lead Team Override Feature (page)
  - Dev Notes (page)
  - Scratchpad (page)
```

---

## 6. Project and Build Setup

- **Tech Stack:** TypeScript project with dependencies.
- **Build and Distribution:**
  - Use `npm` as the package manager.
  - Project folder structure: `src` and `dist`.
  - Target ECMAScript version: ES2023.
  - Use the latest TypeScript version.
  - Build tool is flexible; pick best fit (e.g., `tsc`, `esbuild`, `vite`, etc.).

---

## 7. Markdown Parser

- Use an existing robust markdown parser library to avoid building one from scratch.
- Example: [`markdown-it`](https://github.com/markdown-it/markdown-it) or [`remark`](https://github.com/remarkjs/remark).

---

## 🆕 Feature: Fetch & Replace Unfetched Document Links

### Overview

When parsing and converting ClickUp pages to local Markdown files, the syncer will now intelligently detect and process **page or document links** that reference documents not yet fetched in the current sync session.

### Behavior

- 🔍 **Detection**  
  While parsing Markdown content, any ClickUp links matching the known formats (e.g. `https://app.clickup.com/{workspace_id}/v/dc/{doc_id}`) are inspected.

- 🧠 **Decision**  
  If the `doc_id` or `page_id` in the link does **not** belong to an already fetched document tree, the tool will:
  1. Initiate a new API request to retrieve the full document and its nested pages.
  2. Add the newly fetched document to the working memory.
  3. Resume the link replacement step, now including references from the newly fetched structure.

- 🔁 **Recursive Handling**  
  This feature enables seamless traversal across document trees, ensuring all internal ClickUp links (including deeply nested references) are correctly mapped to local files, regardless of their original inclusion scope.

### Example Workflow

1. Document `A` contains a link to Document `B`, which was not in the initial sync scope.
2. The tool detects the link and fetches Document `B` and its pages.
3. All links in Document `A` and `B` are now locally resolved (e.g. `../Other-Document/Some-Page.md`).

### Benefits

- ✅ No broken local links from overlooked references
- ✅ Maintains document context and structure
- ✅ Ideal for large knowledge bases with cross-linked docs

---

## Summary

This document captures all requirements for a ClickUp API docs syncer project that fetches nested docs and pages in markdown format, handles various ClickUp link patterns, interprets nested page structures (including pages that act as folders), and processes markdown links carefully. The TypeScript project setup includes an appropriate build system targeting ES2023, and the implementation should leverage existing markdown parsing libraries and utilize the markdown.transformer.ts file.
