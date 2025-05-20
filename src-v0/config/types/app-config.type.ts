import { ClickUpConfig } from '../types/clickup-config.type';

export interface AppConfig {
    outputFolder?: string;
    clickup: ClickUpConfig;
}
