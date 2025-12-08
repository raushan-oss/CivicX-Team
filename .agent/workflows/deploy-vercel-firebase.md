---
description: Deploying CivicX to Vercel with Firebase
---

# Deploying to Vercel with Firebase

Follow these steps to ensure your app works correctly on mobile and syncs data across devices.

## 1. Prepare Environment Variables
You need to provide Vercel with your Firebase configuration and your production URL.

1.  Open your local `.env.local` file.
2.  Copy all the keys and values starting with `NEXT_PUBLIC_FIREBASE_...`.
    *   `NEXT_PUBLIC_FIREBASE_API_KEY`
    *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
    *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
    *   `NEXT_PUBLIC_FIREBASE_APP_ID`

## 2. Configure Vercel Project
1.  Go to your Vercel Dashboard and select your project.
2.  Navigate to **Settings** > **Environment Variables**.
3.  Paste the Firebase variables you copied.
4.  **Add one more variable**:
    *   **Key**: `NEXT_PUBLIC_APP_URL`
    *   **Value**: `https://your-project-name.vercel.app` (Replace with your actual Vercel domain).
    *   *Why?* This ensures the links in your emails point to the live site, not `localhost`.

## 3. Web3Forms Configuration
Don't forget your email service key!
1.  Add `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` to Vercel Environment Variables as well.

## 4. Redeploy
1.  If you added variables *after* deploying, you must **Redeploy** for them to take effect.
2.  Go to **Deployments**, click the three dots on the latest deployment, and choose **Redeploy**.

## 5. Verification
1.  Open your deployed app on your laptop.
2.  Open the same app on your phone.
3.  File a report on your laptop.
4.  Verify it appears on your phone (if you implement a real-time list).
5.  File a complaint -> Check Email on Phone -> Click Link.
6.  The status should update on **both** devices.
