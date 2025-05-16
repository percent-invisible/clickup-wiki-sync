import axios from 'axios';
import { ClickupDoc, ClickupPage } from '../types';

/**
 * ClickUp API Client
 */
export class ClickUpAPI {
    private readonly API_KEY: string;
    private readonly BASE_URL = 'https://api.clickup.com/api/v3';

    constructor(options: { apiKey: string }) {
        const { apiKey } = options;
        this.API_KEY = apiKey;
    }

  /**
   * Get a document and its pages from ClickUp
   * @param workspaceId The workspace ID
   * @param documentId The document ID
   * @param maxPageDepth Maximum depth to fetch pages (-1 for unlimited)
   * @returns The document with nested pages
   */
    async getDocument(options: { workspaceId: string; documentId: string; maxPageDepth?: number }): Promise<ClickupDoc> {
        const { workspaceId, documentId, maxPageDepth = -1 } = options;
    try {
      // Fetch pages and doc metadata in parallel
      const pagesUrl = `${this.BASE_URL}/workspaces/${workspaceId}/docs/${documentId}/pages`;
      const metaPromise = this.getDocumentMeta({ workspaceId, documentId });
      const pagesPromise = axios.get(pagesUrl, {
        headers: {
          'Authorization': this.API_KEY,
          'Accept': 'application/json'
        },
        params: {
          max_page_depth: maxPageDepth,
          content_format: 'text/md'
        }
      });
      const [meta, response] = await Promise.all([metaPromise, pagesPromise]);

      // If response is an array, wrap in a synthetic root node with real doc name
      if (Array.isArray(response.data)) {
        return {
          id: documentId,
          workspaceId: workspaceId,
          name: meta?.name || 'Root',
          content: '',
          isRoot: true,
          pages: response.data
        };
      }
      // If it's already an object, just return as-is
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`ClickUp API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  // Fetches document metadata to get the real document name
    private async getDocumentMeta(options: { workspaceId: string; documentId: string }): Promise<{ name: string }> {
        const { workspaceId, documentId } = options;
        const metaUrl = `${this.BASE_URL}/workspaces/${workspaceId}/docs/${documentId}`;
        const response = await axios.get(metaUrl, {
            headers: {
                'Authorization': this.API_KEY,
                'Accept': 'application/json'
            }
    });
        return { name: response.data?.name || 'Root' };
  }

  /**
   * Get a page from ClickUp
   * @param workspaceId The workspace ID
   * @param documentId The document ID 
   * @param pageId The page ID
   * @returns The page content
   */
    async getPage(options: { workspaceId: string; documentId: string; pageId: string }): Promise<ClickupPage> {
        const { workspaceId, documentId, pageId } = options;
    try {
      const url = `${this.BASE_URL}/workspaces/${workspaceId}/docs/${documentId}/pages/${pageId}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': this.API_KEY,
          'Accept': 'application/json'
        },
        params: {
          content_format: 'text/md'
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`ClickUp API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }
}
