import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dir = join(__dirname, 'temporary screenshots');
if (!existsSync(dir)) mkdirSync(dir);

const url = process.argv[2] || 'http://localhost:3001';
const section = process.argv[3] || 'hero';
const scrollTo = parseInt(process.argv[4] || '0');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

if (scrollTo > 0) {
  await page.evaluate((y) => window.scrollTo(0, y), scrollTo);
  await new Promise(r => setTimeout(r, 500));
}

const existing = readdirSync(dir).filter(f => f.startsWith('screenshot-'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0'));
const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;

await page.screenshot({ path: join(dir, `screenshot-${next}-${section}.png`), fullPage: false });
console.log(`Screenshot saved: temporary screenshots/screenshot-${next}-${section}.png`);
await browser.close();
