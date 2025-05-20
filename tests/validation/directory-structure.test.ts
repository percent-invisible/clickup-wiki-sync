import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';

/**
 * Get the directory structure as an object
 */
function getDirectoryStructure(dir: string): Record<string, any> {
    const structure: Record<string, any> = {};
    
    if (!fs.existsSync(dir)) {
        return structure;
    }
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            structure[file] = getDirectoryStructure(filePath);
        } else {
            structure[file] = 'file';
        }
    });
    
    return structure;
}

// Constants
const ACTUAL_DIR = '.clickup';
const EXPECTED_DIR = '.clickup-compare';

/**
 * Directory structure validation tests
 */
describe('Directory Structure Tests', () => {
    // Skip tests if directories don't exist
    if (!fs.existsSync(ACTUAL_DIR)) {
        it('should have an output directory', () => {
            expect.fail(`Output directory ${ACTUAL_DIR} does not exist`);
        });
        return;
    }
    
    if (!fs.existsSync(EXPECTED_DIR)) {
        it('should have a comparison directory', () => {
            expect.fail(`Comparison directory ${EXPECTED_DIR} does not exist`);
        });
        return;
    }
    
    // Get directory structures
    const actualStructure = getDirectoryStructure(ACTUAL_DIR);
    const expectedStructure = getDirectoryStructure(EXPECTED_DIR);
    
    it('should have the same top-level directories', () => {
        const actualTopDirs = Object.keys(actualStructure);
        const expectedTopDirs = Object.keys(expectedStructure);
        
        expect(actualTopDirs.sort()).toEqual(expectedTopDirs.sort());
    });
    
    // Check individual document directories
    Object.keys(expectedStructure).forEach(docDir => {
        describe(`Document directory: ${docDir}`, () => {
            it('should exist in output', () => {
                expect(actualStructure).toHaveProperty(docDir);
            });
            
            it('should have correct structure', () => {
                // Check if the expected directory has files/subdirectories
                const expectedSubItems = Object.keys(expectedStructure[docDir]);
                const actualSubItems = Object.keys(actualStructure[docDir] || {});
                
                // We don't need 100% match, but all expected items should be there
                expectedSubItems.forEach(item => {
                    expect(actualSubItems).toContain(item);
                });
            });
            
            // Verify that pages with children have both .md file and directory
            const pagesWithChildren = Object.entries(expectedStructure[docDir])
                .filter(([key, value]) => typeof value === 'object' && Object.keys(value).length > 0)
                .map(([key]) => key);
            
            pagesWithChildren.forEach(pageName => {
                const pagePath = path.join(ACTUAL_DIR, docDir, pageName);
                const mdFilename = pageName + '.md';
                
                it(`should have directory and .md file for ${pageName}`, () => {
                    // Check if there's a directory
                    expect(fs.existsSync(pagePath)).toBe(true);
                    expect(fs.statSync(pagePath).isDirectory()).toBe(true);
                    
                    // Check if there's an MD file in the parent directory
                    const mdPath = path.join(ACTUAL_DIR, docDir, mdFilename);
                    expect(fs.existsSync(mdPath)).toBe(true);
                    expect(fs.statSync(mdPath).isFile()).toBe(true);
                });
            });
        });
    });
});
