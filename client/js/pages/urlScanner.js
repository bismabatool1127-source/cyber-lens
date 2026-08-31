import { makeScannerPage } from './scannerPage.js';

export const urlScannerPage = makeScannerPage({
  title: 'URL Security Scanner',
  subtitle: 'Paste a suspicious link and Cyber-Lens will analyze its structure, domain and reputation — without ever opening it.',
  mode: 'url',
});
