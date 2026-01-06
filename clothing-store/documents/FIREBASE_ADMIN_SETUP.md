# Firebase Admin SDK Setup Guide

This guide explains how to set up Firebase Admin SDK to enable full user deletion (both Firestore and Authentication) from the staff management page.

## Why is this needed?

When you delete a staff member from the `/owner/staff` page, the system needs to delete the user from:

1. **Firestore Database** (user profile data) - ✅ Works without setup
2. **Firebase Authentication** (login credentials) - ⚠️ Requires Firebase Admin SDK

Without Firebase Admin SDK configured, deleted users will remain in Firebase Authentication and can still attempt to log in.

## Setup Steps

### Step 1: Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **⚙️ Settings** icon → **Project settings**
4. Go to the **Service accounts** tab
5. Click **Generate new private key** button
6. Click **Generate key** in the confirmation dialog
7. A JSON file will be downloaded to your computer

### Step 2: Add Service Account Key to Environment Variables

1. Open the downloaded JSON file in a text editor
2. Copy the **entire contents** of the file
3. Open your `.env.local` file in the project root
4. Add this line:

```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

⚠️ **Important:**

- Copy the entire JSON content as a **single line**
- Wrap it in **single quotes** `'...'`
- Do NOT add line breaks or extra spaces

### Step 3: Restart Development Server

After adding the environment variable:

```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
```

## Verify Setup

To verify the setup is working:

1. Go to `/owner/staff` page
2. Create a test staff account
3. Delete the test account
4. Check the browser console - you should see:
   ```
   Successfully deleted user from Firebase Auth: [user-id]
   ```

If you see a warning instead, the service account key is not configured correctly.

## Security Notes

⚠️ **Never commit the service account key to Git!**

- The `.env.local` file is already in `.gitignore`
- Keep the service account key secure
- Do not share it publicly
- Regenerate it if compromised

## Troubleshooting

### "Firebase Admin not initialized" Warning

**Cause:** Service account key is missing or incorrectly formatted

**Solution:**

1. Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is in `.env.local`
2. Ensure the JSON is on a single line
3. Ensure it's wrapped in single quotes
4. Restart the dev server

### "Error deleting from Firebase Auth"

**Cause:** Invalid service account key or insufficient permissions

**Solution:**

1. Regenerate the service account key
2. Ensure you're using the correct Firebase project
3. Check that the service account has admin permissions

### Users still appear in Firebase Auth after deletion

**Cause:** Firebase Admin SDK is not configured

**Solution:**

1. Follow the setup steps above
2. Manually delete orphaned users from Firebase Console:
   - Go to Firebase Console → Authentication
   - Find and delete users manually

## Current Behavior

### ✅ With Firebase Admin SDK configured:

- Deletes user from Firestore
- Deletes user from Firebase Authentication
- User cannot log in anymore

### ⚠️ Without Firebase Admin SDK configured:

- Deletes user from Firestore only
- User remains in Firebase Authentication
- User can attempt to log in but will get "User data not found" error

---

For more information, see [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
