#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';

// Constants
const EXPECTED_DIR = '.clickup-compare';
const ACTUAL_DIR = '.clickup';

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            fileList = getAllFiles(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

/**
 * Normalize paths for comparison
 */
function normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

/**
 * Compare two files content
 */
function compareFiles(file1: string, file2: string): { 
    identical: boolean; 
    differences?: Array<{ expected: string; actual: string }> 
} {
    const content1 = fs.readFileSync(file1, 'utf8');
    const content2 = fs.readFileSync(file2, 'utf8');
    
    if (content1 === content2) {
        return { identical: true };
    }
    
    // If not identical, find differences
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    
    const differences: Array<{ expected: string; actual: string }> = [];
    const maxLines = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLines; i++) {
        if (lines1[i] !== lines2[i]) {
            differences.push({
                expected: lines1[i] || '(missing line)',
                actual: lines2[i] || '(missing line)'
            });
            
            // Limit differences to avoid overwhelming output
            if (differences.length >= 5) {
                break;
            }
        }
    }
    
    return { identical: false, differences };
}

/**
 * Run the output comparison test using the expected and actual directories
 */
function runOutputComparisonTest(): void {
    // Check if both directories exist
    if (!fs.existsSync(EXPECTED_DIR)) {
        console.error(`Expected directory ${EXPECTED_DIR} does not exist`);
        process.exit(1);
    }
    
    if (!fs.existsSync(ACTUAL_DIR)) {
        console.error(`Actual directory ${ACTUAL_DIR} does not exist`);
        process.exit(1);
    }
    
    // Get all files from both directories
    const expectedFiles = getAllFiles(EXPECTED_DIR)
        .map(f => normalizePath(f));
    
    // Filter out files we had to create for directory structure tests
    const filesToExclude = [
        'Field_Types_Glossary/Display_Fields.md',
        'Field_Types_Glossary/Form_Fields.md',
        'HUB__Church_-_Find-A-Church_Map_Status/The_Workflow_Card.md',
        'catalog-debug.json'
    ];
    
    const actualFiles = getAllFiles(ACTUAL_DIR)
        .map(f => normalizePath(f))
        .filter(f => {
            const relativePath = f.replace(normalizePath(ACTUAL_DIR) + '/', '');
            return !filesToExclude.includes(relativePath);
        });
    
    // Check for missing files
    const missingFiles = expectedFiles.filter(file => 
        !actualFiles.includes(file.replace(EXPECTED_DIR, ACTUAL_DIR))
    );
    
    // Check for extra files
    const extraFiles = actualFiles.filter(file => 
        !expectedFiles.includes(file.replace(ACTUAL_DIR, EXPECTED_DIR))
    );
    
    // Compare content of matching files
    const contentDifferences: Record<string, Array<{ expected: string; actual: string }>> = {};
    let matchingFilesCount = 0;
    
    for (const expectedFile of expectedFiles) {
        const actualFile = expectedFile.replace(EXPECTED_DIR, ACTUAL_DIR);
        
        if (actualFiles.includes(actualFile)) {
            matchingFilesCount++;
            const comparison = compareFiles(expectedFile, actualFile);
            
            if (!comparison.identical && comparison.differences) {
                contentDifferences[expectedFile.replace(EXPECTED_DIR + '/', '')] = comparison.differences;
            }
        }
    }
    
    // Print test results
    console.log('\n==== Test Results ====');
    console.log(`Total expected files: ${expectedFiles.length}`);
    console.log(`Total actual files: ${actualFiles.length}`);
    console.log(`Matching files: ${matchingFilesCount}`);
    console.log(`Missing files: ${missingFiles.length}`);
    console.log(`Extra files: ${extraFiles.length}`);
    console.log(`Files with content differences: ${Object.keys(contentDifferences).length}`);
    
    if (missingFiles.length > 0) {
        console.log('\nMissing files:');
        missingFiles.forEach(file => console.log(` - ${file.replace(EXPECTED_DIR + '/', '')}`));
    }
    
    if (extraFiles.length > 0) {
        console.log('\nExtra files:');
        extraFiles.forEach(file => console.log(` - ${file.replace(ACTUAL_DIR + '/', '')}`));
    }
    
    if (Object.keys(contentDifferences).length > 0) {
        console.log('\nContent differences (showing up to 5 differences per file):');
        
        for (const [file, diffs] of Object.entries(contentDifferences)) {
            console.log(`\nFile: ${file}`);
            (diffs as any[]).forEach((diff, i) => {
                console.log(` Diff #${i + 1}:`);
                console.log(`  Expected: ${diff.expected}`);
                console.log(`  Actual  : ${diff.actual}`);
            });
        }
    }
    
    // Determine overall test result
    const testPassed = missingFiles.length === 0 && 
                        extraFiles.length === 0 && 
                        Object.keys(contentDifferences).length === 0;
    
    console.log(`\nTest ${testPassed ? 'PASSED ✓' : 'FAILED ✗'}`);
    
    if (!testPassed) {
        process.exit(1);
    } else {
        console.log("All files match the expected structure and content!");
    }
}

// Run the test
runOutputComparisonTest();
