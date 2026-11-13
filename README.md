# CodePulse — Programming Course Quiz Platform

A high-performance, serverless programming assessment web platform built with **React 18 + TypeScript (Strict Mode)**, **Vite**, **Tailwind CSS**, **React Router v6 (`HashRouter`)**, **Zustand**, **Zod**, and **Firebase (Auth & Cloud Firestore)**.

---

## 1. System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│                                                             │
│   ┌─────────────────────┐         ┌─────────────────────┐   │
│   │   Student View      │         │   Admin Portal      │   │
│   │   • No login req.   │         │   • Firebase Auth   │   │
│   │   • Read once       │         │   • Direct write    │   │
│   │   • In-memory cache │         │   • Bulk import     │   │
│   │   • Local attempts  │         │   • Backup export   │   │
│   └──────────┬──────────┘         └──────────┬──────────┘   │
│              │ (Read: once on load)          │ (Write)      │
│              ▼                               ▼              │
│       ┌──────────────────────────────────────────────┐      │
│       │      Zod Schema Validation Boundary          │      │
│       │      (Verified on Read & Before Write)       │      │
│       └──────────────────────┬───────────────────────┘      │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │               Firebase Cloud                 │
        │                                              │
        │   • Firebase Auth (Email/Password Admin)     │
        │   • Cloud Firestore (doc: quizzes/main)      │
        │   • Security Rules (Public Read, Auth Write) │
        └──────────────────────────────────────────────┘
```

- **Zero Custom Server**: Backed 100% by Google Firebase client SDKs (`firebase/auth` and `firebase/firestore`).
- **Admin Authentication**: Firebase Auth (Email/Password). Students require no account or sign-in.
- **Single Source of Truth**: All quiz questions, title, and pass mark are stored in Firestore doc `quizzes/main`.
- **Runtime Validation**: Validated with **Zod** (`QuestionBankSchema`) before every Firestore write and after every Firestore read.
- **In-Memory Caching**: Students read the quiz once on application load, cached in memory to minimize network requests.
- **Direct Admin Saves**: Admin question additions, edits, deletions, and settings save directly to Firestore (no export/redeploy flow required).
- **Import & Backup**: "Download JSON Backup" is available for offline archival, and "Import JSON" enables instant bulk-loading.
- **Attempt History**: Preserved locally in `localStorage` on each student's device.

---

## 2. Quick Start

### Prerequisites
- Node.js 18+ and npm

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (see Firebase Setup below)
cp .env.example .env

# 3. Start local development server
npm run dev

# 4. Strict TypeScript type check
npm run typecheck

# 5. Production build
npm run build

# 6. Preview production build
npm run preview
```

---

## 3. Firebase Setup Guide

Follow these steps to connect your Firebase project:

### Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name your project (e.g. `codepulse-quiz`).
3. (Optional) Disable Google Analytics or link an existing account, then click **Create project**.

### Step 2: Register a Web App
1. On your project overview page, click the **Web icon (`</>`)** to add a web application.
2. Enter an app nickname (e.g. `codepulse-web`).
3. Click **Register app**.
4. Firebase will display your `firebaseConfig` credentials object. Keep these for Step 5.

### Step 3: Enable Firebase Authentication
1. In the left navigation menu, go to **Build → Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab, select **Email/Password**.
4. Enable the first toggle (**Email/Password**) and click **Save**.
5. Go to the **Users** tab and click **Add user**.
6. Enter your admin email (e.g., `admin@course.edu`) and a secure password. This is the credential you will use at `/#/admin/login`.

### Step 4: Create Cloud Firestore Database
1. In the left navigation menu, go to **Build → Firestore Database**.
2. Click **Create database**.
3. Choose a database location close to your users (e.g. `nam5 (us-central)` or `eur3 (europe-west)`).
4. Choose **Start in production mode** and click **Create**.

### Step 5: Configure Local Environment Variables
Create or edit `.env` in the root directory:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

### Step 6: Seed Initial Questions
1. Run `npm run dev` and open `http://localhost:5173/#/admin/login`.
2. Sign in with the admin user created in Step 3.
3. If Firestore is empty, click **Seed Firestore from questions.json** or go to **Import / Export JSON** and upload `public/questions.json`.
4. The question bank is now live in Firestore doc `quizzes/main`.

---

## 4. Firestore Security Rules

To ensure students can read the quiz while only authenticated administrators can modify it, paste these exact rules into **Firebase Console → Firestore Database → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Main quiz document: Public read for students, authenticated write for admin
    match /quizzes/main {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Default deny for all other documents/collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish** to activate the rules immediately.

---

## 5. Vercel Deployment & Environment Variables

### Step 1: Deploy to Vercel
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. In [Vercel](https://vercel.com/), click **Add New... → Project** and import the repository.
3. Build Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Configure Vercel Environment Variables
Under **Settings → Environment Variables** in your Vercel project dashboard, add the following variables for **Production**, **Preview**, and **Development**:

| Variable Name | Description | Example |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Google Cloud / Firebase Project ID | `quiz-8c17a` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `quiz-8c17a.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging Sender ID | `763661096559` |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | `1:7636...:web:...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | *(Optional)* Google Analytics ID | `G-BC9LNYMTY2` |

### Step 3: Trigger Deployment
Click **Deploy** (or push a commit). Because the application uses React Router's `HashRouter` (`/#/quiz`, `/#/admin`), all page refreshes and direct links resolve cleanly without requiring server-side rewrite rules.

---

## 6. Architecture & Data Contracts

### Repository Pattern (`QuestionsRepository`)
Question access is abstracted behind a clean interface (`src/lib/questionsRepository.ts`):

```typescript
export interface QuestionsRepository {
  load(): Promise<QuestionBank>;
  save(bank: QuestionBank): Promise<void>;
}
```

- **`FirestoreQuestionsRepository`**: Implements `QuestionsRepository`.
  - **`load()`**: Reads `quizzes/main` from Firestore and runs it through `validateQuestionBankJson()`.
  - **`save(bank)`**: Runs `QuestionBankSchema.parse(bank)` to validate structure, sanitizes undefined values, and persists with `setDoc()`.

### Auth Service (`AuthService`)
Admin session management is abstracted behind `src/features/admin/authService.ts`:

```typescript
export interface AuthService {
  login(email: string, password: string): Promise<AdminSession>;
  logout(): Promise<void>;
  getSession(): AdminSession | null;
  onAuthStateChanged(callback: (session: AdminSession | null) => void): () => void;
}
```

- **`FirebaseAuthService`**: Wraps `signInWithEmailAndPassword`, `signOut`, and `onAuthStateChanged` from `firebase/auth`.
- **`ProtectedRoute`**: Listens to `onAuthStateChanged` to prevent auth-redirect flicker on page reload.

---

## 7. Question Schema Specification

All questions conform to strict Zod schemas defined in `src/lib/questionSchema.ts`:

### Multiple Choice Question (`mcq`)
```typescript
{
  "id": "js_001",
  "type": "mcq",
  "question": "What is the output of `typeof null` in JavaScript?",
  "code": "console.log(typeof null);",      // Optional snippet
  "options": ["\"object\"", "\"null\"", "\"undefined\"", "\"number\""], // 2-6 items
  "answer": 0,                             // Index of correct option (0-based)
  "explanation": "In JavaScript, typeof null returns 'object' due to a historical bug.",
  "category": "JavaScript",                // Optional
  "difficulty": "easy"                     // Optional: "easy" | "medium" | "hard"
}
```

### True / False Question (`true_false`)
```typescript
{
  "id": "py_012",
  "type": "true_false",
  "question": "In Python, lists are immutable.",
  "answer": false,                         // Boolean
  "explanation": "Python lists are mutable; tuples are immutable.",
  "category": "Python",
  "difficulty": "easy"
}
```

---

## 8. Folder Structure

```text
programming-quiz-app/
├── public/
│   └── questions.json              # 120 baseline questions (for seeding & backup)
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Root component initializing quiz bank
│   │   ├── Layout.tsx              # Sticky header, theme toggle, Firestore error screen
│   │   ├── ProtectedRoute.tsx      # Reactive auth guard for /admin routes
│   │   ├── providers.tsx           # Dark/Light theme provider & MotionConfig
│   │   └── router.tsx              # HashRouter route configuration
│   ├── components/ui/              # Atomic UI design system primitives
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── FormattedText.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Table.tsx
│   ├── features/
│   │   ├── setup/                  # Student assessment setup (50/75/100 presets, timers)
│   │   ├── quiz/                   # Active test engine (store, drift-free timer, navigator)
│   │   ├── results/                # Score breakdown, circular ring, review list
│   │   └── admin/                  # Instructor portal
│   │       ├── AdminDashboard.tsx  # CRUD manager, live Firestore status, seed button
│   │       ├── authService.ts      # AuthService interface + FirebaseAuthService
│   │       ├── ImportExport.tsx    # Bulk-load to Firestore & JSON backup download
│   │       ├── LoginPage.tsx       # Firebase Auth email/password login
│   │       ├── QuestionForm.tsx    # Zod-validated Add/Edit modal
│   │       ├── QuestionTable.tsx   # Searchable, filterable question table
│   │       └── Settings.tsx        # Pass mark & default timer settings
│   ├── lib/
│   │   ├── firebase.ts             # Firebase app, auth, and firestore initialization
│   │   ├── questionsRepository.ts  # QuestionsRepository interface & Firestore implementation
│   │   ├── loadQuestions.ts        # In-memory cached quiz loader
│   │   ├── questionSchema.ts       # Zod schemas & diagnostic issue formatter
│   │   ├── scoring.ts              # Pure grading logic
│   │   ├── shuffle.ts              # Fisher-Yates shuffle algorithms
│   │   └── storage.ts              # Versioned localStorage wrapper (attempt history)
│   ├── types/
│   │   └── quiz.ts                 # Domain TypeScript interfaces
│   ├── index.css                   # Tailwind CSS layers and dark mode styles
│   ├── main.tsx                    # React DOM root
│   └── vite-env.d.ts               # Vite & Firebase environment variable typings
├── .env.example                    # Template for Firebase environment variables
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
