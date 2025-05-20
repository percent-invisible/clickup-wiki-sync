import { ClickupDoc, ClickupPage } from '../../types';

/**
 * Type for document metadata response from the ClickUp API.
 */
export type DocumentMetaResponse = {
    id: string;
    name: string;
    workspace_id: string;
};

/**
 * Type for document with pages response from the ClickUp API.
 */
export type DocumentPagesResponse = ClickupPage[] | ClickupDoc;
