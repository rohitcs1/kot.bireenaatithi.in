const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const url = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL;
// Prefer service role key on server
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase credentials not set in environment. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

// A small fetch wrapper with timeout and retries to improve resilience against intermittent network issues.
// Supabase client accepts a custom fetch implementation via the `fetch` option.
const DEFAULT_TIMEOUT = parseInt(process.env.SUPABASE_FETCH_TIMEOUT_MS || '10000', 10); // ms
const DEFAULT_RETRIES = parseInt(process.env.SUPABASE_FETCH_RETRIES || '1', 10);

async function fetchWithTimeout(resource, options = {}) {
  const timeout = typeof options.timeout === 'number' ? options.timeout : DEFAULT_TIMEOUT;
  const maxRetries = typeof options.retries === 'number' ? options.retries : DEFAULT_RETRIES;

  let attempt = 0;
  const attemptFetch = async () => {
    attempt += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const merged = { ...options, signal: controller.signal };
      // Use global fetch (Node 18+). If not available, user environment should polyfill.
      const res = await fetch(resource, merged);
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      // If the error is an abort (timeout) or fetch failed, decide whether to retry
      const isNetworkError = err && (err.name === 'AbortError' || err.type === 'system' || /fetch failed/i.test(String(err.message || '')));
      if (attempt <= maxRetries && isNetworkError) {
        const backoff = 250 * Math.pow(2, attempt - 1);
        console.warn(`Supabase fetch attempt ${attempt} failed, retrying after ${backoff}ms:`, err && err.message ? err.message : err);
        await new Promise(r => setTimeout(r, backoff));
        return attemptFetch();
      }
      // No more retries or non-network error: rethrow
      throw err;
    }
  };

  return attemptFetch();
}

// Create Supabase client passing our fetch wrapper.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { fetch: fetchWithTimeout });

// Quick connectivity check at startup to log helpful errors earlier but don't crash the app.
async function testSupabaseConnection() {
  if (!SUPABASE_URL) return;
  try {
    // Use our fetch wrapper to perform a GET to the Supabase URL root
    const res = await fetchWithTimeout(SUPABASE_URL, { method: 'GET' });
    if (res && (res.ok || res.status === 404 || (res.status >= 200 && res.status < 400))) {
      console.log('✅ Supabase connectivity check: OK');
      return;
    }
    console.error('Supabase connectivity check returned non-OK status:', res && res.status);
  } catch (err) {
    console.error('⚠️ Supabase connectivity check failed:', err && err.message ? err.message : err);
    console.error('This typically means the server cannot reach the Supabase endpoint.');
    console.error('Verify that `SUPABASE_URL` is correct, and check network connectivity (firewall, DNS, outbound internet).');
    console.error('Useful diagnostics: run the `backend/scripts/check-supabase.js` script or run PowerShell commands:');
    console.error("  nslookup <your-supabase-host>\n  Test-NetConnection <your-supabase-host> -Port 443\n  Invoke-WebRequest -Uri 'https://<your-supabase-host>' -TimeoutSec 10");
  }
}

// Run check asynchronously
testSupabaseConnection().catch(() => {});

module.exports = supabase;
