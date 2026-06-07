#!/usr/bin/env node
/**
 * One-time Supabase + GitHub setup for community chat.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=your_token node scripts/setup-supabase.mjs
 *
 * Create a token at: https://supabase.com/dashboard/account/tokens
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_REF = 'cpfxybnbuixzkxtvunmd';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const GITHUB_REPO = 'uscis-green-card-tracker/uscis-green-card-tracker.github.io';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaSql = readFileSync(join(__dirname, '../supabase/schema.sql'), 'utf8');

async function supabaseApi(path, options = {}) {
  const response = await fetch(`https://api.supabase.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`Supabase API ${path} failed (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

function writeLocalEnv(anonKey) {
  const envPath = join(__dirname, '../.env');
  writeFileSync(
    envPath,
    `VITE_SUPABASE_URL=${SUPABASE_URL}\nVITE_SUPABASE_ANON_KEY=${anonKey}\n`,
    'utf8'
  );
  console.log('Wrote local .env for npm run dev');
}

function setGithubSecrets(anonKey) {
  execSync(`gh secret set VITE_SUPABASE_URL -R ${GITHUB_REPO} -b "${SUPABASE_URL}"`, { stdio: 'inherit' });
  execSync(`gh secret set VITE_SUPABASE_ANON_KEY -R ${GITHUB_REPO} -b "${anonKey}"`, { stdio: 'inherit' });
  console.log('GitHub Actions secrets updated.');
}

async function main() {
  if (!TOKEN) {
    console.error('Missing SUPABASE_ACCESS_TOKEN.');
    console.error('Create one at https://supabase.com/dashboard/account/tokens');
    process.exit(1);
  }

  console.log(`Setting up project ${PROJECT_REF}…`);

  console.log('1/4 Enabling anonymous sign-ins…');
  await supabaseApi(`/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    body: JSON.stringify({ external_anonymous_users_enabled: true }),
  });

  console.log('2/4 Running chat schema SQL…');
  await supabaseApi(`/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    body: JSON.stringify({ query: schemaSql }),
  });

  console.log('3/4 Fetching anon API key…');
  const keys = await supabaseApi(`/projects/${PROJECT_REF}/api-keys?reveal=true`);
  const anonKey =
    keys.find((key) => key.name === 'anon' || key.name === 'anon key')?.api_key ||
    keys.find((key) => key.type === 'legacy' && key.name?.toLowerCase?.().includes('anon'))?.api_key ||
    keys.find((key) => key.type === 'publishable')?.api_key;

  if (!anonKey) {
    throw new Error(`Could not find anon key in API response: ${JSON.stringify(keys.map((k) => k.name))}`);
  }

  console.log('4/4 Saving keys locally + GitHub secrets…');
  writeLocalEnv(anonKey);
  setGithubSecrets(anonKey);

  console.log('\nDone. Chat backend is ready.');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('Next: push to main (or re-run deploy workflow) so GitHub Pages picks up the keys.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
