import { ParsedLink } from '../types';

export type LinkHandlerFn = (options: {
    link: ParsedLink;
    basePath: string;
    pageMapping: Record<string, { path: string; name: string }>;
}) => string | null;
