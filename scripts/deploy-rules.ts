import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./scripts/serviceAccountKey.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

async function deploy() {
  const rulesContent = readFileSync('./firestore.rules', 'utf8');
  console.log('Deploying firestore.rules to Firebase project...');
  const securityRules = getSecurityRules();
  await securityRules.releaseFirestoreRulesetFromSource(rulesContent);
  console.log('Firestore security rules successfully released and active!');
}

deploy().catch((err) => {
  console.error('Failed to deploy rules:', err);
  process.exit(1);
});

