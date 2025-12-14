function generateKOT() {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 9000) + 1000; // 4 digits
  return `KOT-${now}-${rand}`;
}

module.exports = { generateKOT };
