import { ClickupPage } from './clickup-page.type';

/**
 * Represents a ClickUp document with its pages.
 */
export type ClickupDoc = {
    id: string;
    workspaceId: string;
    name: string;
    content: string;
    pages?: ClickupPage[];
    isRoot?: boolean;
};
