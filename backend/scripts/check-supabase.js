#!/usr/bin/env node
const dns = require('dns');
const net = require('net');
const https = require('https');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;

function parseHost(supabaseUrl) {
  try {
    const u = new URL(supabaseUrl);
    return u.hostname;
  } catch (e) {
    return null;
  }
}

async function dnsLookup(host) {
  return new Promise((resolve, reject) => {
    dns.lookup(host, { all: true }, (err, addresses) => {
      if (err) return reject(err);
      resolve(addresses);
    });
  });
}

async function tcpConnect(host, port = 443, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(timeout, () => {
      socket.destroy();
      reject(new Error('TCP connect timeout'));
    });
    socket.on('error', (err) => {
      reject(err);
    });
  });
}

async function httpsGet(supabaseUrl, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const req = https.get(supabaseUrl, (res) => {
      resolve({ statusCode: res.statusCode });
    });
    req.setTimeout(timeout, () => {
      req.destroy(new Error('HTTPS request timeout'));
    });
    req.on('error', reject);
  });
}

async function run() {
  if (!SUPABASE_URL) {
    console.error('SUPABASE_URL is not set in environment.');
    console.error('Set SUPABASE_URL in a .env or environment variable and re-run.');
    process.exitCode = 2;
    return;
  }

  const host = parseHost(SUPABASE_URL);
  if (!host) {
    console.error('Could not parse host from SUPABASE_URL:', SUPABASE_URL);
    process.exitCode = 2;
    return;
  }

  console.log('Testing Supabase host:', host);

  try {
    const addrs = await dnsLookup(host);
    console.log('DNS lookup returned addresses:');
    addrs.forEach(a => console.log(' -', a.address, a.family));
  } catch (err) {
    console.error('DNS lookup failed:', err.message || err);
  }

  try {
    await tcpConnect(host, 443, 5000);
    console.log('TCP connect to port 443: OK');
  } catch (err) {
    console.error('TCP connect failed:', err.message || err);
  }

  try {
    const r = await httpsGet(SUPABASE_URL, 8000);
    console.log('HTTPS GET status code:', r.statusCode);
  } catch (err) {
    console.error('HTTPS GET failed:', err.message || err);
  }
}

run().catch(err => {
  console.error('Unexpected error in diagnostics:', err);
  process.exitCode = 1;
});
