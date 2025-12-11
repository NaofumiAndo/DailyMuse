# Firebase Storage Rules Setup

## Issue
Images uploaded in the Creator tab aren't visible to other users because Firebase Storage rules don't allow public read access.

## Solution
Update your Firebase Storage security rules to allow public read access while maintaining write restrictions.

## Steps to Fix

### 1. Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `daily-muse-c79e7`

### 2. Navigate to Storage Rules
1. In the left sidebar, click **Storage**
2. Click on the **Rules** tab at the top

### 3. Update the Rules
Replace your current rules with the following:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to all files in the muses folder
    match /muses/{allPaths=**} {
      allow read: if true;  // Anyone can read
      allow write: if request.auth != null;  // Only authenticated users can write
    }

    // Block all other access by default
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Publish the Rules
1. Click the **Publish** button
2. Wait for confirmation that rules were updated

## What These Rules Do

- **Public Read Access**: Anyone can view images in the `muses/` folder (no authentication required)
- **Authenticated Write Only**: Only logged-in users (admins) can upload images
- **Secure by Default**: All other storage locations remain private

## Testing

After updating the rules:

1. Go to the Creator tab and upload a new image
2. Check the browser console for upload success messages
3. View the Home page or Archive (even in an incognito window) to verify images are visible
4. If you still see errors, check the browser console for specific error messages

## Troubleshooting

### Images Still Not Visible
- Clear your browser cache and refresh
- Check the browser console for CORS errors
- Verify the rules were published successfully
- Wait a few seconds for rules to propagate

### Upload Still Fails
- Check that you're logged in as an admin
- Verify your Firebase authentication is working
- Check browser console for specific error codes
- Ensure you have quota/billing enabled if needed

## Alternative: More Restrictive Rules

If you want to require authentication for viewing images as well:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /muses/{allPaths=**} {
      allow read: if request.auth != null;  // Authenticated users can read
      allow write: if request.auth != null;  // Authenticated users can write
    }
  }
}
```

**Note**: With this setup, users must be logged in to view images.
