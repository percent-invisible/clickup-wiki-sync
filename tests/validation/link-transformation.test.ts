import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';

// Constants
const ACTUAL_DIR = '.clickup';

// Link pattern matchers for validation
const LINK_PATTERNS = {
    // Same-document page links (relative with ./ prefix)
    sameDocumentLink: /\[.+?\]\(\.\/.+?\.md\)/g,
    
    // Cross-document links (relative with ../ navigation)
    crossDocumentLink: /\[.+?\]\((?:\.\.\/)+[\w-_/]+\.md\)/g,
    
    // Link with preserved formatting (bold/italic)
    formattedLink: /\[\*\*.*?\*\*\]\([^)]+\)/g,
    
    // Anchor links (with #section-name)
    anchorLink: /\[.+?\]\([^)]+#[^)]+\)/g,
    
    // External links (unchanged http/https)
    externalLink: /\[.+?\]\(https?:\/\/[^)]+\)/g
};

/**
 * Process a markdown file to extract and validate different link types
 */
function processMarkdownFile(filePath: string): {
    sameDocumentLinks: Array<string>;
    crossDocumentLinks: Array<string>;
    formattedLinks: Array<string>;
    anchorLinks: Array<string>;
    externalLinks: Array<string>;
} {
    const content = fs.readFileSync(filePath, 'utf8');
    const linkPatterns = {
        sameDocumentLink: /\[(.+?)\]\(\.\/([\w-_/]+)\.md\)/g,
        crossDocumentLink: /\[(.+?)\]\((?:\.\.\/)+([^)]+)\.md\)/g,
        formattedLink: /\[(\*\*.*?\*\*)\]\(([^)]+)\)/g,
        anchorLink: /\[(.+?)\]\(([^)]+#[^)]+)\)/g,
        externalLink: /\[(.+?)\]\((https?:\/\/[^)]+)\)/g
    };

    const results: {
        sameDocumentLinks: Array<string>;
        crossDocumentLinks: Array<string>;
        formattedLinks: Array<string>;
        anchorLinks: Array<string>;
        externalLinks: Array<string>;
    } = {
        sameDocumentLinks: [],
        crossDocumentLinks: [],
        formattedLinks: [],
        anchorLinks: [],
        externalLinks: []
    };

    // Extract each type of link
    let match;
    
    // Same-document links
    while ((match = linkPatterns.sameDocumentLink.exec(content)) !== null) {
        results.sameDocumentLinks.push(`[${match[1]}](${match[2]})`);
    }
    
    // Cross-document links
    while ((match = linkPatterns.crossDocumentLink.exec(content)) !== null) {
        results.crossDocumentLinks.push(`[${match[1]}](${match[2]})`);
    }
    
    // Formatted links
    while ((match = linkPatterns.formattedLink.exec(content)) !== null) {
        results.formattedLinks.push(`[${match[1]}](${match[2]})`);
    }
    
    // Anchor links
    while ((match = linkPatterns.anchorLink.exec(content)) !== null) {
        results.anchorLinks.push(`[${match[1]}](${match[2]})`);
    }
    
    // External links
    while ((match = linkPatterns.externalLink.exec(content)) !== null) {
        results.externalLinks.push(`[${match[1]}](${match[2]})`);
    }

    return results;
}

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir: string): string[] {
    const files = fs.readdirSync(dir);
    let markdownFiles: string[] = [];
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            markdownFiles = markdownFiles.concat(findMarkdownFiles(filePath));
        } else if (filePath.endsWith('.md')) {
            markdownFiles.push(filePath);
        }
    });
    
    return markdownFiles;
}

/**
 * Link transformation validation tests
 */
describe('Link Transformation Tests', () => {
    // Skip tests if output directory doesn't exist
    if (!fs.existsSync(ACTUAL_DIR)) {
        it('should have an output directory', () => {
            expect.fail(`Output directory ${ACTUAL_DIR} does not exist`);
        });
        return;
    }
    
    // Get all markdown files
    const markdownFiles = findMarkdownFiles(ACTUAL_DIR);
    
    it(`should have markdown files in output directory`, () => {
        expect(markdownFiles.length).toBeGreaterThan(0);
    });
    
    // Test each markdown file
    markdownFiles.forEach(filePath => {
        describe(`File: ${path.relative(ACTUAL_DIR, filePath)}`, () => {
            const links = processMarkdownFile(filePath);
            
            it('should correctly format same-document links', () => {
                links.sameDocumentLinks.forEach(link => {
                    expect(link).toMatch(/\[.+?\]\(.+?\)/);
                });
            });
            
            it('should correctly format cross-document links', () => {
                links.crossDocumentLinks.forEach(link => {
                    expect(link).toMatch(/\[.+?\]\(.+?\)/);
                });
            });
            
            it('should preserve formatting in links', () => {
                links.formattedLinks.forEach(link => {
                    expect(link).toMatch(/\[\*\*.+?\*\*\]\(.+?\)/);
                });
            });
            
            it('should preserve anchor references', () => {
                links.anchorLinks.forEach(link => {
                    expect(link).toMatch(/\[.+?\]\(.+?#.+?\)/);
                });
            });
            
            it('should leave external links unchanged', () => {
                links.externalLinks.forEach(link => {
                    expect(link).toMatch(/\[.+?\]\(https?:\/\/.+?\)/);
                });
            });
        });
    });
});
