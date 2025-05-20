import { LinkReplacementInfo } from './link-replacement-info.interface';

/**
 * Result of transforming markdown content
 */
export interface TransformResult {
    transformedContent: string;
    replacedLinks: LinkReplacementInfo[];
}
