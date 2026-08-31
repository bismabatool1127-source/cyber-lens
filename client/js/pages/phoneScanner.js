import { makeScannerPage } from './scannerPage.js';

export const phoneScannerPage = makeScannerPage({
  title: 'Phone Number Security Check',
  subtitle: 'Check a phone number for suspicious indicators before you answer or call back.',
  mode: 'phone',
});
