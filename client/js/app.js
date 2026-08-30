import { registerRoute, startRouter, setRouteChangeListener } from './router.js';
import { initTheme } from './theme.js';
import { initNav, setActiveNav } from './components/nav.js';
import { homePage } from './pages/home.js';
import { urlScannerPage } from './pages/urlScanner.js';
import { emailScannerPage } from './pages/emailScanner.js';
import { phoneScannerPage } from './pages/phoneScanner.js';
import { aboutPage } from './pages/about.js';

registerRoute('/', homePage);
registerRoute('/url', urlScannerPage);
registerRoute('/email', emailScannerPage);
registerRoute('/phone', phoneScannerPage);
registerRoute('/about', aboutPage);

setRouteChangeListener(setActiveNav);
initTheme();
initNav();
startRouter();
