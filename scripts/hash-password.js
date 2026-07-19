// Run: node scripts/hash-password.js "yourPasswordHere"
// Copy the output into ADMIN_PASSWORD_HASH in your .env.local / hosting env vars.
const crypto = require("crypto");

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.js "yourPasswordHere"');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(password, salt, 64).toString("hex");

console.log(`${salt}:${hash}`);
