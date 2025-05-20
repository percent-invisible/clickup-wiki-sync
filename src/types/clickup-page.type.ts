/**
 * Represents a ClickUp page within a document.
 */
export type ClickupPage = {
    id: string;
    doc_id: string;
    workspace_id: string;
    parent_page_id?: string;
    name: string;
    content: string;
    date_created?: number;
    date_updated?: number;
    pages?: ClickupPage[];
};
