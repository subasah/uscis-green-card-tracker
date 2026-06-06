import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const ORG_LOGIN = 'uscis-green-card-tracker';
const ORG_NAME = 'USCIS Green Card Tracker';
const CONTACT_EMAIL = 'sah.suba@gmail.com';
const GITHUB_USER = 'subasah';

function getToken() {
  return execSync("printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill | awk -F= '/^password=/{print $2}'", {
    encoding: 'utf8',
  }).trim();
}

async function clickIfVisible(locator) {
  if (await locator.count()) {
    await locator.first().click({ timeout: 8000 });
    return true;
  }
  return false;
}

async function main() {
  const token = getToken();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://github.com/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#login_field', GITHUB_USER);
    await page.fill('#password', token);
    await page.click('input[type="submit"], button[type="submit"]');
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      throw new Error('GitHub web login failed with stored credentials.');
    }

    await page.goto('https://github.com/account/organizations/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const loginField = page.locator('#organization_login, input[name="organization[login]"]');
    if (await loginField.count()) {
      await loginField.first().fill(ORG_LOGIN);
    }

    const profileName = page.locator('#organization_profile_name, input[name="organization[profile_name]"]');
    if (await profileName.count()) {
      await profileName.first().fill(ORG_NAME);
    }

    const billingEmail = page.locator('input[name="organization[billing_email]"], input[type="email"]');
    if (await billingEmail.count()) {
      await billingEmail.first().fill(CONTACT_EMAIL);
    }

    await clickIfVisible(page.getByRole('button', { name: /next|continue|create organization/i }));
    await page.waitForTimeout(2000);
    await clickIfVisible(page.getByRole('button', { name: /free|continue with free/i }));
    await clickIfVisible(page.getByRole('button', { name: /complete setup|create organization|finish/i }));
    await page.waitForTimeout(4000);

    const verify = await fetch(`https://api.github.com/orgs/${ORG_LOGIN}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });

    if (verify.ok) {
      console.log(`SUCCESS: https://github.com/${ORG_LOGIN}`);
      return;
    }

    throw new Error(`Organization not found after form submit (HTTP ${verify.status}).`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
