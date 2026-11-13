import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./scripts/serviceAccountKey.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const target = process.argv[2];

if (!target) {
  console.log('Usage: npx tsx scripts/set-admin.ts <email_or_uid>');
  process.exit(1);
}

async function run() {
  const auth = getAuth();
  let uid = target;

  if (target.includes('@')) {
    const user = await auth.getUserByEmail(target.trim());
    uid = user.uid;
    console.log(`Found user: ${user.email} (UID: ${uid})`);
  }

  await auth.setCustomUserClaims(uid, { admin: true });
  console.log(`Successfully granted { admin: true } custom claim to: ${target}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to set admin claim:', err.message);
  process.exit(1);
});

