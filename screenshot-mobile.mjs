import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dir = join(__dirname, 'temporary screenshots');
if (!existsSync(dir)) mkdirSync(dir);

const url = process.argv[2] || 'http://localhost:3001';
const label = process.argv[3] || 'mobile';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

const existing = readdirSync(dir).filter(f => f.startsWith('screenshot-'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0'));
const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;

await page.screenshot({ path: join(dir, `screenshot-${next}-${label}.png`), fullPage: true });
console.log(`Screenshot saved: temporary screenshots/screenshot-${next}-${label}.png`);
await browser.close();
