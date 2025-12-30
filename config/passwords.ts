/**
 * Password Configuration Reference
 *
 * This file shows you where passwords are configured in the application.
 *
 * HOW TO CHANGE PASSWORDS:
 *
 * Option 1: Edit the default passwords directly in the component files
 *   - StoryAtlas: pages/StoryAtlas.tsx (line 11)
 *     const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
 *
 *   - StoryList: pages/StoryList.tsx (line 11)
 *     const CREATOR_PASSWORD = import.meta.env.VITE_CREATOR_PASSWORD || 'create';
 *
 * Option 2: Use environment variables (more secure)
 *   - Create a .env file in the root directory
 *   - Add: VITE_ADMIN_PASSWORD=your_password_here
 *   - Add: VITE_CREATOR_PASSWORD=your_password_here
 *   - These will override the defaults
 *
 * After changing passwords:
 *   1. npm run build
 *   2. git add .
 *   3. git commit -m "Update passwords"
 *   4. git push
 */

export const PASSWORD_LOCATIONS = {
  storyAtlas: 'pages/StoryAtlas.tsx:11',
  storyList: 'pages/StoryList.tsx:11',
};

// Default passwords (for reference only - change in the actual files)
export const DEFAULT_PASSWORDS = {
  storyAtlas: 'admin123',  // Can be overridden with VITE_ADMIN_PASSWORD
  storyList: 'create',     // Can be overridden with VITE_CREATOR_PASSWORD
};
