// Represents a node in the ClickUp page tree, including folders and pages
export type PageTreeNode = {
    id: string;
    name: string;
    isFolder: boolean;
    children: PageTreeNode[];
};
