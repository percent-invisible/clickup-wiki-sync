# ClickUp Offline Wiki Implementation Plan

After reviewing the current codebase, requirements, and coding standards, I've developed a plan for implementing the ClickUp Offline Wiki from scratch while preserving valuable components from the existing implementation.

## Analysis of Current Codebase

### Strengths to Preserve:
1. **API Client**: The `ClickUpAPI` class is well-structured for interacting with ClickUp's API.
2. **Two-Phase Process**: The conceptual separation of page syncing and link transformation.
3. **TypeScript Type Definitions**: Many types and enums are well-defined.
4. **Record-Based Approach**: The use of records for link handlers aligns with standards.

### Areas for Improvement:

### Absolute Path Handling

All absolute paths for markdown files and folders are determined by inspecting the actual file path returned by the file system after writing, rather than by separate calculation. This ensures the mapping always matches the true, on-disk location and eliminates discrepancies between the mapping and the file structure.

### File/Folder Structure Rules

- **Pages with subpages and empty content:** Only a folder is created (no `.md` file for the page itself).
- **Pages with subpages and non-empty content:** Both a folder and a `.md` file are created. The `.md` file is placed at the root of the folder, sharing its name.
- **Leaf pages (no subpages):** Always create a `.md` file inside the appropriate folder.
- This structure ensures all related content is grouped together, avoids orphan `.md` files at the document root, and results in a navigable, logical offline wiki.

**Example:**
```
.clickup/
└── HUB_Church_-_Find-A-Church_Map_Status/
    └── The_Workflow_Card/
        ├── The_Workflow_Card.md
        ├── Fields/
        │   ├── Status_(ARC_Find-A-Church_Map).md
        │   └── Agreement_Start_Date_(ARC_Find-A-Church_Map).md
        └── Activity_Feed_Items/
            └── HUB_Church_Activity_-_ARC_Find-A-Church_Map_Form_Sent.md
```

1. **Link Transformation Logic**: Current implementation doesn't handle all required patterns and doesn't fully preserve formatting (WYSIWYG).
2. **Error Handling**: Inconsistent error handling across the codebase with no clear progress reporting.
3. **Memory Management**: Inefficient handling of large document trees.
4. **Cross-Document Link Resolution**: Fragile cross-reference handling.
5. **Compliance with Standards**: Some components violate the coding standards.
6. **Testing**: Insufficient test coverage.
7. **Re-sync Behavior**: Needs clear approach to completely overwrite content when re-syncing.
8. **Progress Reporting**: Lacks meaningful progress indicators without overwhelming output.

## Implementation Plan

### 1. Core Domain Structure

```
src/
├── api/
│   ├── types/
│   │   └── api-response.type.ts
│   └── clickup-api.class.ts
├── catalog/
│   ├── types/
│   │   ├── index.ts
│   │   ├── page-catalog-entry.interface.ts
│   │   └── page-mapping.type.ts
│   └── page-catalog.class.ts
├── config/
│   ├── types/
│   │   ├── app-config.type.ts
│   │   └── index.ts
│   └── config-loader.class.ts
├── filesystem/
│   ├── types/
│   │   ├── index.ts
│   │   └── sync-result.interface.ts
│   └── wiki-file-system.class.ts
├── link/
│   ├── types/
│   │   ├── index.ts
│   │   ├── link-type.enum.ts
│   │   ├── parsed-link.interface.ts
│   │   └── link-pattern.interface.ts
│   ├── consts/
│   │   └── link-patterns.const.ts
│   ├── link-parser.class.ts
│   └── link-transformer.class.ts
├── sync/
│   └── clickup-wiki-syncer.class.ts
├── cli/
│   └── clickup-wiki-cli.class.ts  # CLI interface using commander.js
├── types/
│   ├── clickup-doc.type.ts
│   ├── clickup-page.type.ts
│   └── index.ts
└── utils/
    └── clickup-url-parser.class.ts
```

### 2. Core Classes and Responsibilities

#### `ConfigLoader` Class
- Load configuration from YAML file
- Support command-line overrides
- Provide default values
- Validate required fields

```typescript
export class ConfigLoader {
    private static readonly DEFAULT_CONFIG_PATH = 'config.yml';
    private static readonly DEFAULT_CONFIG: ClickupConfig = {
        apiKey: '',
        outputPath: '.clickup',
        maxPageFetchDepth: 3,
        debug: false
    };
    
    public static load(options: { 
        configPath?: string;
        overrides?: Partial<ClickupConfig>; 
    }): ClickupConfig { ... }
    
    private static validateConfig(config: ClickupConfig): void { ... }
}
```

#### `ClickupAPI` Class
- Fetch documents and pages from ClickUp API
- Handle authentication and request formatting
- Parse API responses into domain objects

```typescript
export class ClickupAPI {
    constructor(options: { apiKey: string }) { ... }
    
    public async getDocument(options: {
        workspaceId: string;
        documentId: string;
        maxPageDepth?: number;
    }): Promise<ClickupDoc> { ... }
    
    // Other API methods
}
```

#### `PageCatalog` Class
- Store and index page metadata for efficient lookup
- Provide methods to add entries and query by different keys
- Support dumping catalog to disk for developer debugging (not a production feature)

```typescript
export class PageCatalog {
    private readonly entriesByPageId = new Map<string, PageCatalogEntry>();
    private readonly entriesByUrl = new Map<string, PageCatalogEntry>();
    private readonly entriesByDocId = new Map<string, PageCatalogEntry[]>();
    
    public addEntry(options: { entry: PageCatalogEntry }): void { ... }
    
    public getEntryByPageId(options: { pageId: string }): PageCatalogEntry | undefined { ... }
    
    // Other lookup methods
}
```

#### `WikiFileSystem` Class
- Handle all file system operations 
- Create directory structures and write files
- Manage file paths and sanitization
- Implement complete overwrite behavior for re-syncing documents

```typescript
export class WikiFileSystem {
    constructor(options: { rootDir: string }) { ... }
    
    public async writeDocTree(options: { 
        doc: ClickupDoc; 
        basePath: string 
    }): Promise<SyncResult> { ... }
    
    public async findAllMarkdownFiles(options: { 
        directory: string 
    }): Promise<string[]> { ... }
    
    // Other file system methods
}
```

#### `LinkParser` Class
- Parse different types of ClickUp links
- Extract relevant identifiers (workspace, document, page ids)
- Support all required link patterns

```typescript
export class LinkParser {
    public async parseLinks(options: { content: string }): Promise<ParsedLink[]> { ... }
    
    private parseLink(options: { text: string; url: string }): ParsedLink { ... }
    
    // Other parsing methods
}
```

#### `LinkTransformer` Class
- Transform ClickUp links to local file paths
- Calculate relative paths between files
- Preserve formatting and handle special cases

```typescript
export class LinkTransformer {
    constructor(options: { catalog: PageCatalog }) { ... }
    
    public transform(options: {
        content: string;
        currentFilePath: string;
        diagnoseLinks?: boolean;
    }): Promise<TransformResult> { ... }
    
    // Other transformation methods
}
```

#### `ClickupWikiSyncer` Class
- Orchestrate the entire sync process
- Manage the two-phase approach
- Handle cross-document link processing
- Provide meaningful progress reporting to console without overwhelming output

```typescript
export class ClickupWikiSyncer {
    constructor(options: { 
        api: ClickupAPI;
        fileSystem: WikiFileSystem;
        catalog: PageCatalog;
        transformer: LinkTransformer;
    }) { ... }
    
    public async syncFromUrl(options: { url: string }): Promise<void> { ... }
    
    public async processAllLinks(): Promise<void> { ... }
    
    // Other synchronization methods
}
```

### 3. Enhanced Link Transformation

The link transformation needs to handle all patterns in the requirements with strict WYSIWYG preservation:

```typescript
// In link-transformer.class.ts
public transform(options: { content: string; currentFilePath: string }): Promise<string> {
    const { content, currentFilePath } = options;
    const links = this.linkParser.parseLinks({ content });
    let transformedContent = content;
    
    // Replace standard markdown links
    transformedContent = this.replaceStandardLinks({
        content: transformedContent,
        links,
        currentFilePath
    });
    
    // Replace table cell links
    transformedContent = this.replaceTableCellLinks({
        content: transformedContent,
        links,
        currentFilePath
    });
    
    // Replace nested links
    transformedContent = this.replaceNestedLinks({
        content: transformedContent,
        links,
        currentFilePath
    });
    
    // Preserve formatting within links (bold, italic, etc.)
    transformedContent = this.preserveFormattingInLinks({
        content: transformedContent,
        links,
        currentFilePath
    });
    
    return transformedContent;
}

// Helper method to ensure text formatting is preserved exactly
private preserveFormattingInLinks(options: { 
    content: string;
    links: ParsedLink[];
    currentFilePath: string 
}): string {
    // Implementation ensures text formatting within links remains unchanged
    // Only the URL portion gets replaced, maintaining exact WYSIWYG appearance
    // Malformed links that don't match patterns are left unchanged
}
```

### 4. Testing Strategy

Following the UNIT_TEST_RULE, comprehensive tests will be written for each component:

1. **API Tests**: Mock HTTP requests to test API client behavior
2. **Link Parser Tests**: Test all link patterns against sample inputs
3. **Link Transformer Tests**: Verify correct transformation of various link types
4. **Catalog Tests**: Ensure proper indexing and retrieval
5. **File System Tests**: Verify correct directory structure and file content
6. **Integration Tests**: End-to-end tests of the sync process

### 5. Implementation Phases

1. **Phase 1: Core Infrastructure**
   - Setup project structure
   - Implement base classes
   - Define all types and interfaces
   - Create developer debug capabilities (catalog dump feature)

2. **Phase 2: Basic Sync**
   - ClickUp API integration 
   - File system operations with complete overwrite for re-sync operations
   - Basic markdown transformation
   - Meaningful progress reporting to console

3. **Phase 3: Enhanced Link Transformation**
   - Implement all link patterns with exact WYSIWYG preservation
   - Preserve text formatting (bold, italic) within links
   - Support cross-document links
   - Maintain rendering appearance while updating only URLs

4. **Phase 4: Testing and Optimization**
   - Comprehensive test suite
   - Performance optimization focused on maintainability
   - Basic error handling (no recovery mechanisms needed)

5. **Phase 5: CLI and Documentation**
   - Command-line interface
   - Documentation
   - Final testing

## Adherence to Coding Standards

This implementation plan follows all required standards:

- **SINGLE_EXPORT_RULE**: Each file exports exactly one class or type
- **CLASS_PREFERENCE_RULE**: Using classes throughout
- **RECORD_PROGRAMMING_RULE**: Using record-based approach for patterns and handlers
- **TYPES_LOCATION_RULE**: Types are in dedicated folders within domains
- **UNIT_TEST_RULE**: Comprehensive test coverage
- **FILENAME_PATTERN_RULE**: Following the [name].[type].ts pattern
- **SINGLE_OBJECT_PARAMS_RULE**: All methods take a single options object
- **DESTRUCTURING_RULE**: All methods destructure the options object
- **CONSTANT_NAMING_RULE**: Constants use CONSTANT_CASE
- **NO_MAGIC_STRING**: Using enums instead of magic strings
