import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const ORG_LOGIN = 'uscis-green-card-tracker';
const ORG_NAME = 'USCIS Green Card Tracker';
const CONTACT_EMAIL = 'sah.suba@gmail.com';
const GITHUB_USER = 'subasah';

function getToken() {
  return execSync("printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill | awk -F= '/^password=/{print $2}'", {
    encoding: 'utf8',
  }).trim();
}

async function main() {
  const token = getToken();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const log = [];

  try {
    await page.goto('https://github.com/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#login_field', GITHUB_USER);
    await page.fill('#password', token);
    await page.click('input[type="submit"], button[type="submit"]');
    await page.waitForTimeout(4000);
    log.push(`after login: ${page.url()}`);

    await page.goto('https://github.com/account/organizations/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    log.push(`org new page: ${page.url()}`);
    log.push(`title: ${await page.title()}`);

    writeFileSync('/tmp/gh-org-page.html', await page.content());

    const verify = await fetch(`https://api.github.com/orgs/${ORG_LOGIN}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    log.push(`org api status: ${verify.status}`);
    console.log(log.join('\n'));
  } finally {
    await browser.close();
  }
}

main();
