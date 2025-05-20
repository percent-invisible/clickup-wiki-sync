import { LINK_TYPE } from './link-type.enum';

/**
 * Interface for defining link patterns to be matched and parsed.
 */
export interface LinkPattern {
    /**
     * The type of link this pattern represents.
     */
    type: LINK_TYPE;
    
    /**
     * Regular expression to match this link pattern.
     */
    regex: RegExp;
    
    /**
     * Names of capture groups in the regex.
     */
    captureGroups?: string[];
    
    /**
     * Description of the link pattern.
     */
    description?: string;
}
