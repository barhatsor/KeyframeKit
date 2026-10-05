import { describe, it, expect } from 'vitest';
import { getDocumentStyleSheetsOnLoad } from '../../../src/index';


describe('getDocumentStyleSheetsOnLoad', () => {

  it('returns document.styleSheets when document is already loaded', async () => {
    const sheets = await getDocumentStyleSheetsOnLoad();
    expect(sheets).toBe(document.styleSheets);
  });

});
