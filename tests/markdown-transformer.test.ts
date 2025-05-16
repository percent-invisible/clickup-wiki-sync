import { describe, it, expect } from 'vitest';
import { MarkdownTransformer } from '../src/markdown/markdown-transformer.class';
import * as path from 'path';

describe('MarkdownTransformer', () => {

  const transformer = new MarkdownTransformer();
  const PROJECT_ROOT = '/mock/project/root';
  const DOC_ROOT = PROJECT_ROOT + '/.clickup/doc-folder';
  const pageMapping: Record<string, { path: string; name: string }> = {
    'abc123': { path: `${DOC_ROOT}/index.md`, name: 'Doc' },
    'def456': { path: `${DOC_ROOT}/folder1/subfolder/page1.md`, name: 'page1' },
    'ghi789': { path: `${DOC_ROOT}/folder2/page2.md`, name: 'page2' },
    'jkl012': { path: `${DOC_ROOT}/folder1/page3.md`, name: 'page3' }
  };

  it('rewrites ClickUp doc links to local index.md', () => {
    const content = '[Doc](https://app.clickup.com/123/v/dc/abc123)';
    const currentFilePath = `${DOC_ROOT}/current.md`;
    const expectedLink = path.relative(path.dirname(currentFilePath), pageMapping['abc123'].path);
    const expectedDocLink = expectedLink.startsWith('.') ? expectedLink : './' + expectedLink;
    const result = transformer.transform({ 
      content, 
      basePath: DOC_ROOT, 
      pageMapping,
      currentFilePath
    });
    expect(result).toContain(`[Doc](${expectedDocLink})`);
  });

  it('rewrites ClickUp page links to mapped local path', () => {
    const content = '[Page](https://app.clickup.com/123/v/dc/abc123/def456)';
    const currentFilePath = `${DOC_ROOT}/current.md`;
    const expectedLink = path.relative(path.dirname(currentFilePath), pageMapping['def456'].path);
    const result = transformer.transform({ 
      content, 
      basePath: DOC_ROOT, 
      pageMapping,
      currentFilePath
    });
    expect(result).toContain(`[page1](${expectedLink.startsWith('.') ? expectedLink : './' + expectedLink})`);
  });

  it('leaves EXTERNAL links unchanged', () => {
    const content = '[External](https://example.com/page)';
    const result = transformer.transform({ 
      content, 
      basePath: '/path/to/wiki', 
      pageMapping,
      currentFilePath: '/path/to/wiki/current.md'
    });
    expect(result).toContain('[External](https://example.com/page)');
  });

  it('leaves unchanged local links that are already relative', () => {
    const content = '[Local](./foo/bar.md)';
    const result = transformer.transform({ 
      content, 
      basePath: '/path/to/wiki', 
      pageMapping,
      currentFilePath: '/path/to/wiki/current.md'
    });
    expect(result).toContain('[Local](./foo/bar.md)');
  });

  it('leaves unknown links unchanged', () => {
    const content = '[Unknown](https://other.com/abc)';
    const result = transformer.transform({ 
      content, 
      basePath: '/path/to/wiki', 
      pageMapping,
      currentFilePath: '/path/to/wiki/current.md'
    });
    expect(result).toContain('[Unknown](https://other.com/abc)');
  });

  it('replaces empty link text with mapped page name for ClickUp page links', () => {
    const content = '[](https://app.clickup.com/123/v/dc/abc123/def456)';
    const currentFilePath = `${DOC_ROOT}/current.md`;
    const expectedLink = path.relative(path.dirname(currentFilePath), pageMapping['def456'].path);
    const result = transformer.transform({ 
      content, 
      basePath: DOC_ROOT, 
      pageMapping,
      currentFilePath
    });
    expect(result).toContain(`[page1](${expectedLink.startsWith('.') ? expectedLink : './' + expectedLink})`);
  });
  
  it('generates correct relative paths for files in different folders', () => {
    // Test from a deeper folder to a less deep folder
    const contentFromDeep = '[Link to page2](https://app.clickup.com/123/v/dc/abc123/ghi789)';
    const currentFilePathDeep = `${DOC_ROOT}/folder1/subfolder/deep.md`;
    const expectedLinkDeep = path.relative(path.dirname(currentFilePathDeep), pageMapping['ghi789'].path);
    const expectedDeepLink = expectedLinkDeep.startsWith('.') ? expectedLinkDeep : './' + expectedLinkDeep;
    const resultFromDeep = transformer.transform({ 
      content: contentFromDeep, 
      basePath: DOC_ROOT, 
      pageMapping,
      currentFilePath: currentFilePathDeep
    });
    expect(resultFromDeep).toContain(`[${pageMapping['ghi789'].name}](${expectedDeepLink})`);
    
    // Test from a folder to a subfolder
    const contentToDeep = '[Link to page1](https://app.clickup.com/123/v/dc/abc123/def456)';
    const currentFilePathToDeep = `${DOC_ROOT}/folder2/page2.md`;
    const expectedLinkToDeep = path.relative(path.dirname(currentFilePathToDeep), pageMapping['def456'].path);
    const expectedToDeepLink = expectedLinkToDeep.startsWith('.') ? expectedLinkToDeep : './' + expectedLinkToDeep;
    const resultToDeep = transformer.transform({ 
      content: contentToDeep, 
      basePath: DOC_ROOT, 
      pageMapping,
      currentFilePath: currentFilePathToDeep
    });
    expect(resultToDeep).toContain(`[${pageMapping['def456'].name}](${expectedToDeepLink})`);
    
    // Test between files in the same folder
    const contentSameFolder = '[Link to page3](https://app.clickup.com/123/v/dc/abc123/jkl012)';
    const currentFilePathSameFolder = `${DOC_ROOT}/folder1/other.md`;
    const expectedLinkSameFolder = path.relative(path.dirname(currentFilePathSameFolder), pageMapping['jkl012'].path);
    const expectedSameFolderLink = expectedLinkSameFolder.startsWith('.') ? expectedLinkSameFolder : './' + expectedLinkSameFolder;
    const resultSameFolder = transformer.transform({ 
      content: contentSameFolder, 
      basePath: DOC_ROOT, 
      pageMapping,
      currentFilePath: currentFilePathSameFolder
    });
    expect(resultSameFolder).toContain(`[${pageMapping['jkl012'].name}](${expectedSameFolderLink})`);
  });
});
