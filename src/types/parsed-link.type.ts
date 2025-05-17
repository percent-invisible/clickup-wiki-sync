import { LinkType } from './link-type.enum';

// Represents a parsed markdown or ClickUp link
export type ParsedLink = {
    type: LinkType;
    text: string;
    url: string;
    workspaceId?: string;
    docId?: string;
    pageId?: string;
    documentId?: string;
};
