import { describe, it, expect } from 'vitest';
import { LinkParser } from '../src/markdown/link-parser.class';
import { LinkType } from '../src/types';


describe('LinkParser', () => {

  const parser = new LinkParser();

  it('extracts regular markdown links', () => {
    const content = 'This is a [link](https://example.com) in markdown.';
    const links = parser.parseLinks({ content });
    expect(links.length).toBe(1);
    expect(links[0]).toMatchObject({
      type: LinkType.UNKNOWN,
      text: 'link',
      url: 'https://example.com'
    });
  });

  it('extracts ClickUp doc links', () => {
    const content = '[Doc](https://app.clickup.com/123/v/dc/abc123)';
    const links = parser.parseLinks({ content });
    expect(links[0]).toMatchObject({
      type: LinkType.DOC,
      workspaceId: '123',
      documentId: 'abc123',
      text: 'Doc',
      url: 'https://app.clickup.com/123/v/dc/abc123'
    });
  });

  it('extracts ClickUp page links', () => {
    const content = '[Page](https://app.clickup.com/123/v/dc/abc123/def456)';
    const links = parser.parseLinks({ content });
    expect(links[0]).toMatchObject({
      type: LinkType.PAGE,
      workspaceId: '123',
      documentId: 'abc123',
      pageId: 'def456',
      text: 'Page',
      url: 'https://app.clickup.com/123/v/dc/abc123/def456'
    });
  });

  it('extracts ClickUp linked page links', () => {
    const content = '[Linked](https://app.clickup.com/123/docs/abc123/def456)';
    const links = parser.parseLinks({ content });
    expect(links[0]).toMatchObject({
      type: LinkType.LINKED_PAGE,
      workspaceId: '123',
      documentId: 'abc123',
      pageId: 'def456',
      text: 'Linked',
      url: 'https://app.clickup.com/123/docs/abc123/def456'
    });
  });

  it('extracts empty markdown links', () => {
    const content = '[](../../1.ARC-Find-A-Church-Map.md)';
    const links = parser.parseLinks({ content });
    expect(links.length).toBe(1);
    expect(links[0]).toMatchObject({
      type: LinkType.EXTERNAL,
      text: '',
      url: '../../1.ARC-Find-A-Church-Map.md'
    });
  });

  it('extracts inner link from ClickUp-escaped nested markdown links', () => {
    const content = '[text]([text](https://app.clickup.com/123/v/dc/abc123/def456))';
    const links = parser.parseLinks({ content });
    expect(links.length).toBe(1);
    expect(links[0]).toMatchObject({
      text: 'text',
      url: 'https://app.clickup.com/123/v/dc/abc123/def456',
      type: LinkType.PAGE,
      workspaceId: '123',
      documentId: 'abc123',
      pageId: 'def456'
    });
  });

  it('extracts markdown links in table cells', () => {
    const content = '| Field Type | Status Indicator ([Status Indicator](../../../../Field-Types-Glossary/requirements/Display-Fields/8.Status-Indicator.md)) |';
    const links = parser.parseLinks({ content });
    expect(links.length).toBe(1);
    expect(links[0]).toMatchObject({
      type: LinkType.EXTERNAL,
      text: 'Status Indicator',
      url: '../../../../Field-Types-Glossary/requirements/Display-Fields/8.Status-Indicator.md'
    });
  });

  it('skips image markdown links', () => {
    const content = '![](https://t18003214.p.clickup-attachments.com/t18003214/ccff9171-44d8-4dd4-9c18-0a6974221409/image.png)';
    const links = parser.parseLinks({ content });
    expect(links.length).toBe(0);
  });

  it('parses phone links as unknown', () => {
    const content = '[+1 (715) 111-2222](tel:+17151112222)';
    const links = parser.parseLinks({ content });
    expect(links.length).toBe(1);
    expect(links[0]).toMatchObject({
      type: LinkType.UNKNOWN,
      text: '+1 (715) 111-2222',
      url: 'tel:+17151112222'
    });
  });

  it('parses task links as unknown', () => {
    const content = '[HUB: Church - ARC Find-A-Church Map Calculated Status](https://app.clickup.com/t/86b2t0yxc)';
    const links = parser.parseLinks({ content });
    expect(links.length).toBe(1);
    expect(links[0]).toMatchObject({
      type: LinkType.UNKNOWN,
      text: 'HUB: Church - ARC Find-A-Church Map Calculated Status',
      url: 'https://app.clickup.com/t/86b2t0yxc'
    });
  });

  it('extracts relative links as EXTERNAL', () => {
    const content = '[Local](./foo/bar.md)';
    const links = parser.parseLinks({ content });
    expect(links[0]).toMatchObject({
      type: LinkType.EXTERNAL,
      text: 'Local',
      url: './foo/bar.md'
    });
  });
});
