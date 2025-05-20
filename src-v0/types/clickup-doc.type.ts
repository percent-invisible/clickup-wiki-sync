// Represents a ClickUp page (non-root)
export type ClickupPage = {
    id: string;
    name: string;
    content: string;
    workspaceId: string;
    docId?: string;
    pages?: ClickupPage[];
};

// Represents a ClickUp document root, which has isRoot: true
export type ClickupDoc = ClickupPage & {
    isRoot: true;
};
