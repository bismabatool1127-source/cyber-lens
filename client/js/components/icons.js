/** Inline SVG icon builder + shared icon paths. */

export const ICON_PATHS = {
  shield:
    'M12 1.8 3.5 5v6.1c0 5.2 3.6 9.4 8.5 11.1 4.9-1.7 8.5-5.9 8.5-11.1V5L12 1.8Zm0 2.1 6.6 2.5v4.7c0 4.2-2.8 7.7-6.6 9.2-3.8-1.5-6.6-5-6.6-9.2V6.4L12 3.9Z',
  shieldCheck:
    'M12 1.8 3.5 5v6.1c0 5.2 3.6 9.4 8.5 11.1 4.9-1.7 8.5-5.9 8.5-11.1V5L12 1.8Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 4.8-4.8 1.4 1.4-6.2 6.2Z',
  shieldAlert:
    'M12 1.8 3.5 5v6.1c0 5.2 3.6 9.4 8.5 11.1 4.9-1.7 8.5-5.9 8.5-11.1V5L12 1.8Zm1 13.7h-2v-2h2v2Zm0-3.5h-2V7h2v5Z',
  shieldX:
    'M12 1.8 3.5 5v6.1c0 5.2 3.6 9.4 8.5 11.1 4.9-1.7 8.5-5.9 8.5-11.1V5L12 1.8Zm3.6 12.4-1.4 1.4L12 13.4l-2.2 2.2-1.4-1.4 2.2-2.2-2.2-2.2 1.4-1.4 2.2 2.2 2.2-2.2 1.4 1.4-2.2 2.2 2.2 2.2Z',
  url: 'M3.9 12a5.1 5.1 0 0 1 5.1-5.1h3a1 1 0 1 0 0-2H9A7.1 7.1 0 0 0 9 19h3a1 1 0 1 0 0-2H9A5.1 5.1 0 0 1 3.9 12Zm4.1 1a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm5.1-8.1a1 1 0 0 1 1 1 .9.9 0 0 1 0 .2A5.1 5.1 0 0 1 15 12a5.1 5.1 0 0 1 .9 2.9v.2a1 1 0 1 1-2 0 3.1 3.1 0 0 0-.2-1.2h.3a1 1 0 0 1 0-2h.2A3.1 3.1 0 0 0 14 10a1 1 0 0 1-1-1c0-.4 0-.8.1-1.1Z',
  email:
    'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.4l8 5.3 8-5.3V6H4Zm16 2.9-7.4 4.9a1 1 0 0 1-1.2 0L4 8.9V18h16V8.9Z',
  phone:
    'M6.6 2.3 8.9 2a1 1 0 0 1 1.1.7l.9 3.2a1 1 0 0 1-.3 1.1L9 8.4a13.6 13.6 0 0 0 6.6 6.6l1.4-1.6a1 1 0 0 1 1.1-.3l3.2.9a1 1 0 0 1 .7 1.1l-.3 2.3a1.9 1.9 0 0 1-1.9 1.6C10.3 19 5 13.7 5 4.2c0-1 .7-1.8 1.6-1.9Z',
  gauge:
    'M12 3a9 9 0 0 0-9 9c0 2.4.9 4.5 2.5 6.1h13A9 9 0 0 0 12 3Zm0 2a7 7 0 0 1 6.3 10H5.7A7 7 0 0 1 12 5Zm3.5 3.6 1.4 1.4-4.2 4.2a1 1 0 0 1-1.4 0l-2.1-2.1 1.4-1.4 1.4 1.4 3.5-3.5Z',
  radar:
    'M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm0 4a6 6 0 1 0 6 6h-2a4 4 0 1 1-4-4V6Zm0 4a2 2 0 1 0 2 2h-2v-2Zm1-9.9V8a5 5 0 0 1 4.3 2.6l1.8-1A7 7 0 0 0 13 2.1Z',
  pulse:
    'M2 12h4l2-7 4 14 2-7h8v-2h-9.4l-.6 2.1L8.4 5 6 13.6 4.6 10H2v2Z',
  report:
    'M6 2h9l4 4v16H6V2Zm8 1.5V7h3.5L14 3.5ZM8 10h8v1.6H8V10Zm0 4h8v1.6H8V14Zm0 4h5v1.6H8V18Z',
};

export function svgIcon(name, size = 18) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', ICON_PATHS[name]);
  svg.appendChild(path);
  return svg;
}
