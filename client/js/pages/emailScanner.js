import { makeScannerPage } from './scannerPage.js';

export const emailScannerPage = makeScannerPage({
  title: 'Email Security Scanner',
  subtitle: 'Cyber-Lens examines the sender, message content and every link found inside the email.',
  mode: 'email',
});
