import { describe, it, expect } from 'vitest';
import { ConfigLoader } from '../src/config/config.loader';
import fs from 'fs';

const TEMP_CONFIG = './tests/temp_config.yml';
const TEMP_CONFIG_CONTENT = 'clickup:\n  api_key: "test_key_123"\n';

describe('ConfigLoader.load', () => {
    it('loads config from default path', () => {
        fs.writeFileSync(TEMP_CONFIG, TEMP_CONFIG_CONTENT);
        const config = ConfigLoader.load({ configPath: TEMP_CONFIG });
        expect(config.clickup.apiKey).toBe('test_key_123');
        fs.unlinkSync(TEMP_CONFIG);
    });

    it('throws if api_key missing', () => {
        fs.writeFileSync(TEMP_CONFIG, 'clickup:\n  api_key: ""\n');
        expect(() => ConfigLoader.load({ configPath: TEMP_CONFIG })).toThrow();
        fs.unlinkSync(TEMP_CONFIG);
    });
});
