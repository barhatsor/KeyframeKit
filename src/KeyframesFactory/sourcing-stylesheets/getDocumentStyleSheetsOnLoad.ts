
/**
 * Gets a document's stylesheets when it loads,
 * or immediately returns them if it's already loaded.
 * @param document The document to get stylesheets from.
 * @group Sourcing Stylesheets
 */
export async function getDocumentStyleSheetsOnLoad(
  document = window.document
) {

  await waitForDocumentLoad(document);

  return document.styleSheets;

}

async function waitForDocumentLoad(document: Document) {

  const isLoaded = () => document.readyState === 'complete';

  if (isLoaded())
    return;

  const { promise, resolve } = Promise.withResolvers<void>();
  const cleanup = new AbortController();

  const onReadyStateChange = () => {
    if (isLoaded())
      resolve();
  };

  document.addEventListener(
    'readystatechange',
    onReadyStateChange,
    { signal: cleanup.signal }
  );

  await promise;

  // remove the listener
  cleanup.abort();

}
