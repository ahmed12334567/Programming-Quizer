# Programming Quizer

A modern, high-performance programming assessment and quiz platform built with **React 18**, **TypeScript (Strict Mode)**, **Vite**, **Tailwind CSS**, **Framer Motion**, and **Google Cloud Firestore**.

---

## 1. Overview & Key Features

- **Cloud Firestore Storage**: Questions are stored as independent documents in the `questions` collection (`questions/{questionId}`) with Document ID mapped to Question ID.
- **Dynamic Multi-Unit Selection**: Students can select one or multiple course units simultaneously (React.js, PHP, Web Development, Laravel) with dynamic question count badges.
- **Flexible Question Count**: Interactive count selector supporting a range slider, step buttons, direct numeric inputs, dynamic presets, and an "All Questions" mode.
- **Timed & Drift-Free Engine**: Configurable test timer with auto-submit, interactive question navigator, and bookmarking.
- **Detailed Scoring & Review**: Instant score calculation, circular progress gauge, pass/fail status, and per-question reviews with explanations and code snippets.
- **Instructor Admin Portal**:
  - Protected by Firebase Authentication (Email/Password) with server-side custom claim verification (`admin: true`) and allowlists.
  - Full Question CRUD (Create, Read, Search/Filter, Edit, Delete).
  - Safe delete confirmation modal displaying question ID, unit, and question preview.
  - JSON Import & Export with automated batch writes (500 docs/batch) and Zod schema validation.
  - Global settings persistence in Firestore (`settings/quiz`).
- **Polished UI & Theme Switcher**: Fluid dark/light mode toggle with rotating animated icons, responsive cards, and clean typography.

---

## 2. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                             Client Browser                             │
│                                                                        │
│   ┌──────────────────────────────┐    ┌────────────────────────────┐   │
│   │         Student Portal       │    │      Instructor Admin      │   │
│   │  • Multi-Unit Filter         │    │  • Firebase Auth Guard     │   │
│   │  • Dynamic Count Selector    │    │  • Question Table & Filter │   │
│   │  • Timed Quiz Engine         │    │  • Zod Validated CRUD Form │   │
│   │  • Local Attempt Storage     │    │  • Safe Delete Modal       │   │
│   │  • Instant Score & Review    │    │  • Bulk Import / Export    │   │
│   └──────────────┬───────────────┘    └──────────────┬─────────────┘   │
│                  │                                   │                 │
│                  ▼                                   ▼                 │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │           Questions Service & Zod Validation Layer             │   │
│   │       (src/features/admin/questionsService.ts & questionSchema)│   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │
                                   ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                     Google Cloud Firestore                    │
    │                                                               │
    │   • `questions/{questionId}`: 263 questions across units      │
    │   • `settings/quiz`: Default passing mark & timer values      │
    │   • Security Rules: Public Read / Admin-Only Write            │
    └───────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript 5, Vite, React Router v6 (`HashRouter`) |
| **Styling & UI** | Tailwind CSS, Lucide React, Prism React Renderer |
| **Animation** | Framer Motion |
| **State & Validation** | Zustand, Zod |
| **Backend / DB** | Google Firebase Client SDK (`firebase/app`, `firebase/firestore`, `firebase/auth`) |
| **Admin Tools** | Firebase Admin SDK (`firebase-admin`) for security rules & claim management |

---

## 4. Quick Start

### Prerequisites
- Node.js 18+ and npm

```bash
# 1. Clone repository & install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your Firebase project credentials

# 3. Start local development server
npm run dev

# 4. Strict TypeScript type check
npm run typecheck

# 5. Production build
npm run build
```

---

## 5. Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# Firebase Web App Credentials (from Firebase Console -> Project Settings)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:...
VITE_FIREBASE_MEASUREMENT_ID=G-...

# Optional Admin Email / UID Allowlist (fallback in addition to custom claim `admin: true`)
VITE_ADMIN_EMAILS=admin@course.edu
VITE_ADMIN_UIDS=
```

---

## 6. Firebase & Security Setup

### 1. Enable Firebase Authentication
1. Go to **Firebase Console → Build → Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. Under the **Users** tab, add your administrator email (e.g. `admin@course.edu`).

### 2. Assign Administrator Privileges
Run the included administration script to grant the `{ admin: true }` custom claim:

```bash
npx tsx scripts/set-admin.ts admin@course.edu
```

*(Requires `scripts/serviceAccountKey.json` from Firebase Console → Project Settings → Service accounts).*

### 3. Deploy Firestore Security Rules
The security rules ensure anyone can take quizzes while strictly restricting modifications to authenticated administrators:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && (
        request.auth.token.admin == true ||
        request.auth.token.email in ['admin@course.edu']
      );
    }

    match /questions/{questionId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /settings/{settingId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy the rules directly using:
```bash
npx tsx scripts/deploy-rules.ts
```
*(Or paste them into Firebase Console → Firestore Database → Rules).*

---

## 7. Project Structure

```text
programming-quiz-app/
├── public/
│   └── questions_mcq_tf-v2.json    # Master question bank (263 questions)
├── scripts/
│   ├── seed.ts                     # Admin script for seeding Firestore
│   ├── set-admin.ts                # Assigns `admin: true` custom claim to users
│   └── deploy-rules.ts             # Programmatically deploys firestore.rules
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Root application entry
│   │   ├── Layout.tsx              # Navigation bar, branding, theme toggle
│   │   ├── ProtectedRoute.tsx      # Firebase Auth guard with claims verification
│   │   ├── providers.tsx           # Theme & animation configuration
│   │   └── router.tsx              # HashRouter routes definition
│   ├── components/ui/              # Atomic reusable UI components
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── ConfirmModal.tsx        # Styled delete confirmation modal
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Table.tsx
│   ├── features/
│   │   ├── admin/                  # Instructor management dashboard
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── authService.ts      # Client Firebase Auth service
│   │   │   ├── ImportExport.tsx    # Batch import/export JSON tool
│   │   │   ├── LoginPage.tsx       # Secure admin login form
│   │   │   ├── QuestionForm.tsx    # Create & edit question modal
│   │   │   ├── questionsService.ts # Service layer for Firestore CRUD & batching
│   │   │   ├── QuestionTable.tsx   # Searchable & filterable question list
│   │   │   └── Settings.tsx        # Pass mark & default timer settings
│   │   ├── quiz/                   # Active exam runtime
│   │   │   ├── Navigator.tsx       # Question grid & status overview
│   │   │   ├── QuestionCard.tsx    # MCQ & True/False interactive card
│   │   │   ├── QuizPage.tsx        # Core assessment controller
│   │   │   ├── store.ts            # Zustand quiz state machine
│   │   │   └── Timer.tsx           # Visual countdown timer
│   │   ├── results/                # Post-assessment analysis
│   │   │   ├── ResultsPage.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   └── ScoreRing.tsx
│   │   └── setup/                  # Assessment customization
│   │       ├── CountSelector.tsx   # Slider & dynamic question count selector
│   │       ├── SetupPage.tsx       # Multi-unit selector & configuration
│   │       └── TimerSettings.tsx
│   ├── lib/
│   │   ├── firebase.ts             # Client Firebase initialization
│   │   ├── questionSchema.ts       # Zod schemas for MCQ and True/False types
│   │   └── scoring.ts              # Pure scoring calculation utilities
│   ├── types/
│   │   └── quiz.ts                 # TypeScript domain types & interfaces
│   ├── index.css                   # Global styles & Tailwind CSS directives
│   └── main.tsx                    # React application bootstrap
├── .env.example                    # Environment variable template
├── .gitignore                      # Secrets & build artifact exclusion
├── firebase.json                   # Firebase Hosting & Firestore configuration
├── firestore.rules                 # Cloud Firestore access control rules
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 8. Deployment Guide

### Vercel / Netlify
1. Connect your repository to Vercel or Netlify.
2. Build Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the environment variables from your `.env` to the provider's Environment Variables settings.
4. Deploy.

### Firebase Hosting
```bash
# Build the production bundle
npm run build

# Deploy hosting and Firestore rules
firebase deploy
```

---

## 9. License

This project is licensed under the MIT License.
