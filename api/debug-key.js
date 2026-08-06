module.exports = function handler(req, res) {
  const raw = process.env.GOOGLE_PRIVATE_KEY || '';
  res.status(200).json({
    hasEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
    hasSheetId: !!process.env.GOOGLE_SHEET_ID,
    length: raw.length,
    startsWithQuote: raw.startsWith('"'),
    startsWithBegin: raw.trimStart().startsWith('-----BEGIN'),
    endsWithEnd: raw.trimEnd().endsWith('-----') || raw.trimEnd().endsWith('KEY-----'),
    hasLiteralBackslashN: raw.includes('\\n'),
    hasRealNewline: raw.includes('\n'),
    lineCount: raw.split('\n').length,
    firstChars: raw.slice(0, 35),
    lastChars: raw.slice(-35),
  });
};
