# ClothingStore POS Setup Guide

## 🚀 Quick Start

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd clothing-store
   npm install
   ```

2. **Run the Application** (works without Firebase for UI testing)

   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

   - You'll see a yellow notification banner if Firebase is not configured
   - The application will work for UI testing, but authentication features will be disabled

4. **Set up Firebase** (see detailed steps below) to enable authentication

5. **Configure Environment Variables** (see detailed steps below)

## Prerequisites

1. Node.js (v18 or higher)
2. Firebase account (optional for UI testing)
3. Firebase project (optional for UI testing)

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard

### 2. Enable Authentication

1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" authentication

### 3. Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location

### 4. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon to add a web app
4. Register your app
5. Copy the configuration object

### 5. Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Authentication Flow Testing

### Customer Authentication

1. Go to the home page
2. Click "Customer Login" or "Create Account"
3. Test registration and login functionality

### Owner Authentication

1. Go to the home page
2. Click "Owner Login"
3. Note: Owner accounts must be created manually in Firebase Console

### Creating an Owner Account (Manual Process)

1. Go to Firebase Console > Authentication > Users
2. Click "Add user"
3. Enter email and password
   - Email: `owner@example.com`
   - Password: `password123` (or any password of your choice)
4. Go to Firestore Database
5. Create a document in the "users" collection:
   - Collection ID: `users`
   - Document ID: `owner@example.com` (set Document ID to the UID from Authentication)
   ```json
   {
     "email": "owner@example.com",
     "displayName": "Store Owner",
     "role": "owner",
     "createdAt": "2025-01-01T00:00:00.000Z"
   }
   ```
   ```json
     {
     "email": "customer@example.com",
     "displayName": "Customer",
     "role": "customer",
     "createdAt": "2025-01-01T00:00:00.000Z"
   }
  ```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   │   ├── customer/         # Customer login/register
│   │   └── owner/         # Owner login
│   ├── customer/             # Customer dashboard
│   └── owner/             # Owner dashboard
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   └── ui/               # UI components
├── contexts/             # React contexts
├── lib/                  # Utility libraries
├── services/             # Business logic services
└── types/                # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🎯 Features Implemented

- **Authentication System**: Complete login/register for customers and owners
- **Role-based Access Control**: Different dashboards for customers and owners
- **Form Validation**: Zod schemas with real-time validation
- **UI Components**: Reusable Button, Input, Loading components
- **Protected Routes**: Automatic redirection based on authentication state
- **Firebase Integration**: Authentication and Firestore database
- **TypeScript Support**: Full type safety throughout the application
- **Graceful Fallbacks**: Application works without Firebase configuration
- **Configuration Notifications**: Clear user guidance when Firebase is not set up

## Next Steps

- Implement product management for owners
- Add shopping cart functionality for customers
- Implement order processing
- Add payment integration
- Implement inventory management
- Add analytics and reporting

## Troubleshooting

### Common Issues

1. **Firebase configuration errors**: Make sure all environment variables are set correctly
2. **Authentication not working**: Check if Email/Password is enabled in Firebase Console
3. **Firestore permission errors**: Ensure Firestore rules allow read/write access
4. **Build errors**: Run `npm run type-check` to identify TypeScript issues

### Support

If you encounter any issues, please check:

1. Firebase Console for authentication and database setup
2. Browser console for JavaScript errors
3. Terminal for build/runtime errors
