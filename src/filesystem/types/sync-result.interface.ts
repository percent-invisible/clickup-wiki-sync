import { PageMapping } from '../../catalog/types';

/**
 * Interface for the result of a sync operation.
 */
export interface SyncResult {
    /**
     * Mapping of page/document IDs to their metadata.
     */
    pageMapping: PageMapping;
    
    /**
     * Path to the root directory of the synced document.
     */
    docPath: string;
    
    /**
     * Number of pages synced.
     */
    pageCount: number;
}
