import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { ConfigLoaderOptions } from './types/config-loader-options.type';
import { AppConfig } from './types/app-config.type';

/**
 * Loads configuration from a YAML file at the given path (default: './config.yml').
 * Returns the parsed config object.
 */
export class ConfigLoader {
    public static load(options: ConfigLoaderOptions = {}): AppConfig {
        const { configPath = './config.yml' } = options;
        
        const file = fs.readFileSync(configPath, 'utf8');
        const config = yaml.load(file) as any;
        
        if (!config?.clickup?.api_key) {
            throw new Error(`Missing required config: clickup.api_key in ${configPath}`);
        }
        
        // Convert snake_case to camelCase for consistent naming
        return {
            clickup: {
                apiKey: config.clickup.api_key
            },
            outputFolder: config.outputFolder
        };
    }
}
