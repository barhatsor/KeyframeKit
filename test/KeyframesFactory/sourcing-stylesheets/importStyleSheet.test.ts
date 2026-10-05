import { describe, it, expect, vi } from 'vitest';
import { importStyleSheet } from '../../../src/index';


describe('importStyleSheet', () => {

  it('fetches stylesheet', async () => {

    const cssText = `@keyframes testAnim { 0% { width: 0%; } 100% { width: 100%; } }`;

    const styleSheet = await importStyleSheet(`data:text/css,${cssText}`);

    expect(styleSheet).toBeInstanceOf(CSSStyleSheet);
    expect(styleSheet.cssRules[0]).toBeInstanceOf(CSSKeyframesRule);

  });

  it('throws custom TypeError on fetch failure', async () => {

    const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation(
      async () => (new Response(null, { status: 404 }))
    );

    const exampleURL = 'https://example.com';

    await expect(
      importStyleSheet(exampleURL)
    ).rejects.toThrow(
      expect.toSatisfy(e =>
        e instanceof TypeError &&
        e.message === `Failed to fetch dynamically imported module: ${exampleURL}`
      )
    );

    expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(exampleURL);

    // restore the method and stop spying on it
    fetchSpy.mockRestore();

  });

});
