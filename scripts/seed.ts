import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync("./scripts/serviceAccountKey.json", "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function seed() {
 const raw = JSON.parse(readFileSync("./public/questions.json", "utf8"));
  const questions: any[] = Array.isArray(raw) ? raw : raw.questions;

  const BATCH_SIZE = 500;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = db.batch();

    for (const q of questions.slice(i, i + BATCH_SIZE)) {
      const { id, ...data } = q;
      batch.set(db.collection("questions").doc(id), data);
    }

    await batch.commit();
    console.log(`Committed ${Math.min(i + BATCH_SIZE, questions.length)} / ${questions.length}`);
  }
}

seed().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});