const { chromium } = require('playwright');

let browser;

const getBrowser = async () => {
  if (browser) return browser;

  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  return browser;
};

const withPage = async (fn) => {
  const activeBrowser = await getBrowser();
  const context = await activeBrowser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  try {
    return await fn(page);
  } finally {
    await context.close();
  }
};

const closeBrowser = async () => {
  if (!browser) return;
  await browser.close();
  browser = undefined;
};

module.exports = {
  withPage,
  closeBrowser
};
