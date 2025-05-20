import { describe, it, expect } from 'vitest';
import { WikiFileSystem } from '../../src/filesystem/wiki-file-system.class';
import { join } from 'path';

describe('WikiFileSystem', () => {
    // Create a test instance with a mock root directory
    const wikiFs = new WikiFileSystem({ rootDir: '.test-output' });
    
    // Access the private sanitizeFileName method for testing
    // @ts-ignore - Accessing private method for testing
    const sanitizeFileName = wikiFs.sanitizeFileName.bind(wikiFs);
    
    describe('sanitizeFileName', () => {
        it('should handle null or empty input', () => {
            expect(sanitizeFileName(null as any)).toBe('Untitled');
            expect(sanitizeFileName('')).toBe('Untitled');
        });
        
        it('should replace spaces with underscores', () => {
            expect(sanitizeFileName('Hello World')).toBe('Hello_World');
            expect(sanitizeFileName('  Multiple   Spaces  ')).toBe('Multiple_Spaces');
        });
        
        it('should replace invalid file characters with underscores', () => {
            expect(sanitizeFileName('File/With\\Invalid:Chars?')).toBe('File_With_Invalid_Chars_');
            expect(sanitizeFileName('File*With|Multiple<>Invalid"Chars')).toBe('File_With_Multiple_Invalid_Chars');
        });
        
        it('should collapse multiple underscores into one', () => {
            expect(sanitizeFileName('Multiple__Underscores')).toBe('Multiple_Underscores');
            expect(sanitizeFileName('File/With\\:Multiple___Invalid___Chars')).toBe('File_With_Multiple_Invalid_Chars');
        });
        
        it('should handle parentheses correctly', () => {
            expect(sanitizeFileName('Status (ARC Find-A-Church Map)')).toBe('Status_(ARC_Find-A-Church_Map)');
        });
        
        it('should handle real-world examples correctly', () => {
            expect(sanitizeFileName('HUB: Church - Find-A-Church Map Status')).toBe('HUB_Church_-_Find-A-Church_Map_Status');
            expect(sanitizeFileName('Agreement Start Date (ARC Find-A-Church Map)')).toBe('Agreement_Start_Date_(ARC_Find-A-Church_Map)');
        });
    });
});
