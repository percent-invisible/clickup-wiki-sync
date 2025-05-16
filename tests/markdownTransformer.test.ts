import { describe, it, expect } from 'vitest';
import { MarkdownTransformer } from '../src/markdown/markdown.transformer';
import { LinkType } from '../src/types';


describe('MarkdownTransformer', () => {

  const transformer = new MarkdownTransformer();
  const pageMapping = {
    'def456': 'pages/page1.md',
    'ghi789': 'pages/page2.md'
  };

  it('rewrites ClickUp doc links to local index.md', () => {
    const content = '[Doc](https://app.clickup.com/123/v/dc/abc123)';
    const result = transformer.transform({ content, basePath: 'docs', pageMapping });
    expect(result).toContain('[Doc](docs/index.md)');
  });

  it('rewrites ClickUp page links to mapped local path', () => {
    const content = '[Page](https://app.clickup.com/123/v/dc/abc123/def456)';
    const result = transformer.transform({ content, basePath: 'docs', pageMapping });
    expect(result).toContain('[Page](pages/page1.md)');
  });

  it('leaves EXTERNAL links unchanged', () => {
    const content = '[Local](./foo/bar.md)';
    const result = transformer.transform({ content, basePath: 'docs', pageMapping });
    expect(result).toContain('[Local](./foo/bar.md)');
  });

  it('leaves unknown links unchanged', () => {
    const content = '[Unknown](https://other.com/abc)';
    const result = transformer.transform({ content, basePath: 'docs', pageMapping });
    expect(result).toContain('[Unknown](https://other.com/abc)');
  });

  it('replaces empty link text with mapped page name for ClickUp page links', () => {
    const content = '[](https://app.clickup.com/123/v/dc/abc123/def456)';
    const result = transformer.transform({ content, basePath: 'docs', pageMapping });
    expect(result).toContain('[page1](pages/page1.md)');
  });
});
