import { ParsedLink } from '../../types';
import { PageMapping } from '../../filesystem/types';

export type LinkHandlerFn = (options: {
    link: ParsedLink;
    basePath: string;
    pageMapping: PageMapping;
}) => string | null;
