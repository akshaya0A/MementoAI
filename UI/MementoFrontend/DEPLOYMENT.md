# MementoAI Firebase Deployment Guide

This guide will help you deploy your MementoAI app to Firebase Hosting.

## Prerequisites

1. **Firebase CLI**: Install Firebase CLI globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Make sure you have access to the `mementoai` Firebase project.

## Setup Steps

### 1. Install Dependencies

First, install all project dependencies including Firebase tools:

```bash
npm install
```

### 2. Login to Firebase

Sign in to your Google account and authenticate with Firebase:

```bash
firebase login
```

### 3. Initialize Firebase (if not already done)

If you haven't initialized Firebase in this project yet:

```bash
firebase init
```

Select:
- ✅ Hosting: Configure files for Firebase Hosting
- Select your existing project: `mementoai`
- Public directory: `dist`
- Single-page app: Yes
- Overwrite index.html: No

### 4. Build the Web App

Build your Expo app for web deployment:

```bash
npm run build:web
```

This will create a `dist` folder with your static web files.

### 5. Deploy to Firebase

Deploy your app to Firebase Hosting:

```bash
npm run deploy
```

Or manually:

```bash
firebase deploy --only hosting:momentoai
```

## Available Scripts

- `npm run build:web` - Build the app for web deployment
- `npm run deploy` - Build and deploy to Firebase
- `npm run deploy:preview` - Deploy to a preview channel

## Configuration Files

- `firebase.json` - Firebase hosting configuration
- `.firebaserc` - Firebase project configuration
- `lib/firebase.ts` - Firebase SDK configuration
- `lib/firebaseService.ts` - Firebase Firestore operations

## Your App URLs

After successful deployment:
- **Live URL**: https://momentoai.web.app
- **Firebase Console**: https://console.firebase.google.com/project/mementoai

## Troubleshooting

### Build Issues
- Make sure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run lint`
- Verify Expo configuration in `app.json`

### Deployment Issues
- Ensure you're logged in: `firebase login`
- Check project configuration: `firebase projects:list`
- Verify hosting configuration in `firebase.json`

### Firebase Configuration
- Verify your Firebase config in `lib/firebase.ts`
- Check Firestore rules in Firebase Console
- Ensure proper authentication setup if using Firebase Auth

## Development vs Production

### Development
```bash
npm start
# or
npm run web
```

### Production
```bash
npm run build:web
npm run deploy
```

## Environment Variables

For production, consider using environment variables for sensitive configuration:

1. Create `.env.local` for local development
2. Set environment variables in Firebase Console for production
3. Update `lib/firebase.ts` to use environment variables

## Monitoring

- **Firebase Console**: Monitor app performance and usage
- **Analytics**: View user analytics and behavior
- **Hosting**: Check hosting performance and errors
- **Firestore**: Monitor database usage and performance

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates
3. Set up monitoring and alerts
4. Implement CI/CD pipeline
5. Add Firebase Analytics tracking
6. Set up Firebase Authentication
7. Configure Firestore security rules
