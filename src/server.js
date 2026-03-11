const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { withPage, closeBrowser } = require('./playwrightService');
const { validateUrlPayload } = require('./validators');

const app = express();
app.use(express.json({ limit: '1mb' }));

const DEFAULT_TIMEOUT = Number(process.env.PW_TIMEOUT_MS || 30000);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'playwright-api' });
});

app.post('/v1/page-title', async (req, res) => {
  const parsed = validateUrlPayload(req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.message });

  try {
    const title = await withPage(async (page) => {
      await page.goto(parsed.url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT });
      return page.title();
    });

    return res.json({ url: parsed.url, title });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/v1/screenshot', async (req, res) => {
  const parsed = validateUrlPayload(req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.message });

  try {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pw-api-'));
    const outputPath = path.join(tempDir, `screenshot-${Date.now()}.png`);

    await withPage(async (page) => {
      await page.goto(parsed.url, { waitUntil: 'networkidle', timeout: DEFAULT_TIMEOUT });
      await page.screenshot({ path: outputPath, fullPage: true });
    });

    return res.download(outputPath, 'screenshot.png', async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/v1/extract', async (req, res) => {
  const parsed = validateUrlPayload(req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.message });

  try {
    const result = await withPage(async (page) => {
      await page.goto(parsed.url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT });

      const [title, h1, links] = await Promise.all([
        page.title(),
        page.locator('h1').first().textContent(),
        page.locator('a').evaluateAll((nodes) => nodes.slice(0, 10).map((node) => ({
          text: node.textContent?.trim() || '',
          href: node.href
        })))
      ]);

      return {
        title,
        firstH1: h1?.trim() || null,
        links
      };
    });

    return res.json({ url: parsed.url, ...result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
  console.log(`Playwright API listening on http://localhost:${port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await closeBrowser();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
