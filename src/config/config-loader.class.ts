import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ClickupConfig } from './types';

/**
 * Class for loading configuration from YAML files.
 */
export class ConfigLoader {
    /**
     * Default config file path relative to project root.
     */
    private static readonly DEFAULT_CONFIG_PATH = 'config.yml';
    
    /**
     * Default config values.
     */
    private static readonly DEFAULT_CONFIG: ClickupConfig = {
        apiKey: '',
        outputPath: '.clickup',
        maxPageFetchDepth: 3, // Default to 3 levels of recursion
        debug: false
    };

    /**
     * Loads configuration from a YAML file.
     */
    public static load(options: { 
        configPath?: string;
        overrides?: Partial<ClickupConfig>; 
    }): ClickupConfig {
        const { configPath = this.DEFAULT_CONFIG_PATH, overrides = {} } = options;
        let config = { ...this.DEFAULT_CONFIG };
        let usingDefaults = true;
        
        try {
            // Resolve the config path to absolute path
            const absoluteConfigPath = path.isAbsolute(configPath)
                ? configPath
                : path.resolve(process.cwd(), configPath);
            
            // Check if config file exists
            if (fs.existsSync(absoluteConfigPath)) {
                const fileContent = fs.readFileSync(absoluteConfigPath, 'utf8');
                const parsed = yaml.load(fileContent) as { clickup?: Partial<ClickupConfig> };
                
                // Merge with defaults
                if (parsed && parsed.clickup) {
                    config = {
                        ...config,
                        ...parsed.clickup
                    };
                    usingDefaults = false;
                }
            } else {
                console.warn(`Config file not found at ${absoluteConfigPath}, using defaults.`);
            }
            
            // Apply overrides from command line
            if (Object.keys(overrides).length > 0) {
                config = {
                    ...config,
                    ...overrides
                };
                usingDefaults = false;
            }
            
            // Only validate required configs when not using defaults
            if (!usingDefaults) {
                this.validateConfig(config);
            }
            
            return config;
        } catch (error) {
            console.error('Error loading config:', error);
            throw new Error(`Failed to load configuration: ${error}`);
        }
    }
    
    /**
     * Validates that the required config values are present.
     */
    private static validateConfig(config: ClickupConfig): void {
        if (!config.apiKey) {
            throw new Error('ClickUp API key is required. Set it in config.yml or provide via command line.');
        }
        
        if (!config.outputPath) {
            throw new Error('Output path is required. Set it in config.yml or provide via command line.');
        }
    }
}
