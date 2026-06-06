#!/usr/bin/env node
import { execSync } from 'node:child_process';

const ORG = 'uscis-green-card-tracker';
const ORG_PAGES_REPO = `${ORG}.github.io`;
const SOURCE_REPO = 'subasah/uscis-green-card-tracker';
const PAGES_URL = `https://${ORG}.github.io/`;

function getToken() {
  return execSync("printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill | awk -F= '/^password=/{print $2}'", {
    encoding: 'utf8',
  }).trim();
}

function gh(args) {
  const token = getToken();
  return execSync(`gh ${args}`, {
    encoding: 'utf8',
    env: { ...process.env, GH_TOKEN: token },
  }).trim();
}

async function waitForOrg(maxAttempts = 72) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      gh(`api orgs/${ORG} --jq .login`);
      console.log(`\nOrganization ${ORG} is ready.`);
      return;
    } catch {
      process.stdout.write(`Waiting for organization ${ORG} (${attempt}/${maxAttempts})...\r`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  throw new Error(`Organization ${ORG} was not found. Create it at https://github.com/account/organizations/new?org=${ORG}`);
}

async function main() {
  console.log(`Target site: ${PAGES_URL}`);
  await waitForOrg();

  console.log(`Transferring ${SOURCE_REPO} -> ${ORG}/${ORG_PAGES_REPO}`);
  gh(`api -X POST repos/${SOURCE_REPO}/transfer -f new_owner=${ORG} -f new_name=${ORG_PAGES_REPO}`);

  console.log('Enabling GitHub Pages (workflow build)...');
  try {
    gh(`api repos/${ORG}/${ORG_PAGES_REPO}/pages -X POST -f build_type=workflow`);
  } catch (error) {
    if (!String(error.message).includes('409')) throw error;
    console.log('Pages already configured.');
  }

  console.log(`Done. Live URL after deploy: ${PAGES_URL}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
