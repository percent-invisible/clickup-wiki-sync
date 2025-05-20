import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
// Using the correct ClickUp document URL format that matches the parser pattern
// The URL must be in the format: https://app.clickup.com/{workspace_id}/v/dc/{doc_id}/{page_id}
// For our tests, we'll use the first page ID as well to match the pattern
const TEST_URL = 'https://app.clickup.com/18003214/v/dc/h5d8e-3374/h5d8e-18114';
const EXPECTED_DIR = '.clickup-compare';
const ACTUAL_DIR = '.clickup';

/**
 * Test utility class for comparing ClickUp Offline Wiki output
 */
export class OutputComparison {
    /**
     * Recursively get all files in a directory
     */
    public static getAllFiles(dir: string, fileList: string[] = []): string[] {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                fileList = OutputComparison.getAllFiles(filePath, fileList);
            } else {
                fileList.push(filePath);
            }
        });
        
        return fileList;
    }

    /**
     * Normalize paths for comparison
     */
    public static normalizePath(filePath: string): string {
        return filePath.replace(/\\/g, '/');
    }

    /**
     * Compare two files content
     */
    public static compareFiles(file1: string, file2: string): { 
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
     * Run the comparison test
     */
    public static async runTest(): Promise<void> {
        // Run the sync process
        try {
            console.log(`Syncing document from ${TEST_URL}...`);
            
            // Use the CLI with test configuration
            await execAsync(`node dist/index.js sync --url ${TEST_URL} --output ${ACTUAL_DIR} -c test-config.yml`);
            
            console.log('Sync complete, validating output...');
            
            // Get all files from both directories
            const expectedFiles = OutputComparison.getAllFiles(EXPECTED_DIR)
                .map(f => OutputComparison.normalizePath(f));
            
            const actualFiles = OutputComparison.getAllFiles(ACTUAL_DIR)
                .map(f => OutputComparison.normalizePath(f));
            
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
                    const comparison = OutputComparison.compareFiles(expectedFile, actualFile);
                    
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
            }
        } catch (error) {
            console.error('Test failed with error:', error);
            process.exit(1);
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    OutputComparison.runTest();
}
