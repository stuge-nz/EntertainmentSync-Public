'use strict';
(async () => {
  const root = new URL('./', location.href);
  const pointer = new URL('manifest.json', root);
  pointer.searchParams.set('check', Date.now().toString());
  const response = await fetch(pointer, {cache: 'no-store'});
  if (!response.ok) throw Error('Home is temporarily unavailable. Please try again.');
  const manifest = await response.json();
  if (!/^releases\/[a-f0-9]{24}\/index\.html$/.test(manifest.app)) throw Error('Invalid Home release.');
  const release = new URL(manifest.app, root);
  const page = await fetch(release);
  if (!page.ok) throw Error('Home release is unavailable. Please try again.');
  const content = new DOMParser().parseFromString(await page.text(), 'text/html');
  content.querySelectorAll('base').forEach(node => node.remove());
  const base = content.createElement('base');
  base.href = new URL('./', release).href;
  content.head.prepend(base);
  // Mount the immutable app in this document, preserving the stable address.
  // Parsed scripts are inert: re-create them after the complete DOM is installed.
  const scripts = [...content.querySelectorAll('script')];
  scripts.forEach(script => script.remove());
  document.documentElement.replaceWith(document.importNode(content.documentElement, true));
  for (const old of scripts) {
    const script = document.createElement('script');
    for (const attribute of old.attributes) script.setAttribute(attribute.name, attribute.value);
    script.textContent = old.textContent;
    script.async = false;
    document.head.append(script);
  }
})().catch(error => {
  const status = document.getElementById('status');
  if (status) status.textContent = error.message;
});
