function checkPassword(req) {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return true; // not configured yet, skip gate
  const got = req.headers['x-site-password'];
  return got === expected;
}

module.exports = { checkPassword };
