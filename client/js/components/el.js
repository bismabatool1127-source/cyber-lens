/** DOM builder that only ever inserts text content — user data never becomes HTML. */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'style') node.setAttribute('style', value);
    else if (key.startsWith('data-')) node.setAttribute(key, value);
    else if (key.startsWith('aria-')) node.setAttribute(key, value);
    else node[key] = value;
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}
