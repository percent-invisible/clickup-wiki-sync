import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ConfigLoader } from '../../src/config/config-loader.class';

// Mock the fs module
vi.mock('fs', () => ({
    default: {
        readFileSync: vi.fn(),
        existsSync: vi.fn(),
    },
}));

// Mock path.resolve to return predictable paths for testing
vi.mock('path', () => ({
    default: {
        resolve: vi.fn((cwd, configPath) => `/mocked/path/${configPath}`),
        isAbsolute: vi.fn((p) => p.startsWith('/')),
    },
}));

describe('ConfigLoader', () => {
    const mockConfig = {
        clickup: {
            apiKey: 'test-api-key',
            outputPath: 'test-output',
            maxPageFetchDepth: 5,
            debug: true
        }
    };
    
    const mockYaml = `clickup:
  apiKey: "test-api-key"
  outputPath: "test-output"
  maxPageFetchDepth: 5
  debug: true
`;
    
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        
        // Setup default mock implementations
        fs.existsSync = vi.fn().mockReturnValue(true);
        fs.readFileSync = vi.fn().mockReturnValue(mockYaml);
    });
    
    afterEach(() => {
        vi.resetAllMocks();
    });
    
    describe('load', () => {
        it('should load config from the specified path', () => {
            const config = ConfigLoader.load({
                configPath: 'custom-config.yml'
            });
            
            expect(path.resolve).toHaveBeenCalledWith(expect.any(String), 'custom-config.yml');
            expect(fs.existsSync).toHaveBeenCalledWith('/mocked/path/custom-config.yml');
            expect(fs.readFileSync).toHaveBeenCalledWith('/mocked/path/custom-config.yml', 'utf8');
            
            expect(config).toEqual({
                apiKey: 'test-api-key',
                outputPath: 'test-output',
                maxPageFetchDepth: 5,
                debug: true
            });
        });
        
        it('should use default values when config file does not exist', () => {
            // Mock file to not exist
            fs.existsSync = vi.fn().mockReturnValue(false);
            
            // Spy on console.warn
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            const config = ConfigLoader.load({
                configPath: 'missing-config.yml'
            });
            
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Config file not found'));
            
            // Should use default values
            expect(config).toEqual({
                apiKey: '',
                outputPath: '.clickup',
                maxPageFetchDepth: 3, // Match the default value in ConfigLoader
                debug: false
            });
            
            consoleWarnSpy.mockRestore();
        });
        
        it('should apply overrides from options', () => {
            const config = ConfigLoader.load({
                configPath: 'config.yml',
                overrides: {
                    apiKey: 'override-key',
                    debug: false
                }
            });
            
            // Should override apiKey and debug, but keep other values from config
            expect(config).toEqual({
                apiKey: 'override-key',
                outputPath: 'test-output',
                maxPageFetchDepth: 5,
                debug: false
            });
        });
        
        it('should throw an error if apiKey is missing', () => {
            // Mock a config without apiKey
            const incompleteYaml = `clickup:
  outputPath: "test-output"
  maxPageFetchDepth: 5
  debug: true
`;
            fs.readFileSync = vi.fn().mockReturnValue(incompleteYaml);
            
            expect(() => {
                ConfigLoader.load({ configPath: 'config.yml' });
            }).toThrow('ClickUp API key is required');
        });
    });
});
