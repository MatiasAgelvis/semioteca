import { describe, expect, it } from 'vitest';
import { stripHtml, sanitizeHtml, htmlToPdfmake, htmlToMarkdown } from './html';

describe('stripHtml', () => {
  it('removes simple tags', () => {
    expect(stripHtml('<em>hello</em>')).toBe('hello');
    expect(stripHtml('<strong>bold</strong> text')).toBe('bold text');
  });

  it('removes self-closing tags', () => {
    expect(stripHtml('line<br/>break')).toBe('linebreak');
  });

  it('removes tags with attributes', () => {
    expect(stripHtml('<em class="x" onclick="evil()">hi</em>')).toBe('hi');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<strong><em>nested</em></strong>')).toBe('nested');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtml('just text')).toBe('just text');
  });
});

describe('sanitizeHtml', () => {
  it('keeps allowed tags', () => {
    const input = '<em>italic</em> <strong>bold</strong> <sup>1</sup> <sub>2</sub>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('removes disallowed tags but keeps text', () => {
    expect(sanitizeHtml('<script>alert(1)</script>hello')).toBe('alert(1)hello');
    expect(sanitizeHtml('<div>block</div>')).toBe('block');
  });

  it('handles mixed content', () => {
    expect(sanitizeHtml('<em>ok</em><iframe src="x">bad</iframe>')).toBe('<em>ok</em>bad');
  });

  it('preserves attributes on allowed tags', () => {
    // Documents current behavior: attributes survive on allowed tags
    expect(sanitizeHtml('<em class="x">hi</em>')).toBe('<em class="x">hi</em>');
  });
});

describe('htmlToPdfmake', () => {
  it('converts plain text to a single span', () => {
    expect(htmlToPdfmake('hello')).toEqual([{ text: 'hello' }]);
  });

  it('converts strong to bold', () => {
    expect(htmlToPdfmake('<strong>bold</strong>')).toEqual([{ text: 'bold', bold: true }]);
  });

  it('converts em to italics', () => {
    expect(htmlToPdfmake('<em>italic</em>')).toEqual([{ text: 'italic', italics: true }]);
  });

  it('converts sup to superScript', () => {
    expect(htmlToPdfmake('<sup>1</sup>')).toEqual([{ text: '1', superScript: true }]);
  });

  it('converts sub to subScript', () => {
    expect(htmlToPdfmake('<sub>2</sub>')).toEqual([{ text: '2', subScript: true }]);
  });

  it('handles mixed content with surrounding text', () => {
    const result = htmlToPdfmake('before <strong>bold</strong> after');
    expect(result).toEqual([{ text: 'before ' }, { text: 'bold', bold: true }, { text: ' after' }]);
  });

  it('handles nested tags', () => {
    const result = htmlToPdfmake('<strong><em>nested</em></strong>');
    expect(result).toEqual([{ text: 'nested', bold: true, italics: true }]);
  });

  it('handles br as newline', () => {
    const result = htmlToPdfmake('line1<br>line2');
    expect(result).toEqual([{ text: 'line1' }, { text: '\n' }, { text: 'line2' }]);
  });

  it('returns empty array for empty input', () => {
    expect(htmlToPdfmake('')).toEqual([]);
  });

  it('leaves unknown tags as literal text', () => {
    // htmlToPdfmake only matches em|strong|sup|sub|br; other tags remain in text
    expect(htmlToPdfmake('<div>text</div>')).toEqual([{ text: '<div>text</div>' }]);
  });
});

describe('htmlToMarkdown', () => {
  it('converts strong to bold markdown', () => {
    expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**');
  });

  it('converts em to italic markdown', () => {
    expect(htmlToMarkdown('<em>italic</em>')).toBe('*italic*');
  });

  it('converts sup', () => {
    expect(htmlToMarkdown('<sup>1</sup>')).toBe('^1^');
  });

  it('converts sub', () => {
    expect(htmlToMarkdown('<sub>2</sub>')).toBe('~2~');
  });

  it('converts br to newline', () => {
    expect(htmlToMarkdown('a<br>b')).toBe('a\nb');
  });

  it('strips unknown tags', () => {
    expect(htmlToMarkdown('<div>text</div>')).toBe('text');
  });

  it('handles mixed content', () => {
    expect(htmlToMarkdown('plain <strong>bold</strong> more')).toBe('plain **bold** more');
  });
});
