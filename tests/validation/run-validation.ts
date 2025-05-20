#!/usr/bin/env node
import { OutputComparison } from './output-comparison.test';
import { beforeAll } from 'vitest';
import { LinkTransformationTest } from './link-transformation.test';
import { DirectoryStructureTest } from './directory-structure.test';

/**
 * Main validation runner that executes all validation tests
 * in a comprehensive test suite
 */
export class ValidationRunner {
    /**
     * Run all validation tests
     */
    public static async run(): Promise<void> {
        console.log('=== ClickUp Offline Wiki Validation Suite ===');
        
        try {
            // First run the output comparison to sync the document
            console.log('\n▶ Running Output Comparison Test');
            await OutputComparison.runTest();
            
            // Then run structural tests using Mocha
            console.log('\n▶ Running Link Transformation Tests');
            LinkTransformationTest.runTests();
            
            console.log('\n▶ Running Directory Structure Tests');
            DirectoryStructureTest.runTests();
            
            console.log('\n✅ All validation tests completed successfully');
        } catch (error) {
            console.error('\n❌ Validation tests failed:', error);
            process.exit(1);
        }
    }
}

// Run if this file is executed directly
if (require.main === module) {
    ValidationRunner.run();
}
