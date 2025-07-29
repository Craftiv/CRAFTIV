# Google Authentication Setup Guide

## Network Configuration

The Google sign-in was failing because the frontend couldn't connect to your backend. I've fixed this by:

1. **Moving `apiClient.ts`** from `app/constants/` to `constants/` (outside the app folder)
2. **Creating a network configuration** in `config/network.ts`
3. **Updating all API calls** to use the correct IP address

## How to Configure for Your Environment

### For Android Emulator (Default)

The app is currently configured to use `http://10.0.2.2:8080` which works for Android emulators.

### For Physical Device

If you're testing on a physical device, you need to:

1. Find your computer's IP address:
   - Windows: Run `ipconfig` in Command Prompt
   - Mac/Linux: Run `ifconfig` in Terminal
   - Look for your local IP (usually starts with 192.168.x.x or 10.x.x.x)

2. Update `Frontend/config/network.ts`:

   ```typescript
   CURRENT: 'http://YOUR_COMPUTER_IP:8080'
   ```

### For iOS Simulator

If using iOS simulator and backend is on the same machine:

   ```typescript
   CURRENT: 'http://localhost:8080'
   ```

## Backend Setup

I've also added the missing Google OAuth endpoints to your backend:

- `GET /api/auth/google/url` - Returns Google OAuth URL
- `GET /api/auth/google/callback` - Handles OAuth callback
- `POST /api/auth/google` - Handles ID token verification

## Testing

1. Make sure your backend is running on port 8080
2. Update the network configuration if needed
3. Try the Google sign-in button

## Troubleshooting

- **"Network request failed"**: Check that your backend is running and the IP address is correct
- **"Route missing default export"**: This should be fixed now that apiClient.ts is moved
- **Google OAuth errors**: Make sure your Google Client ID is correct in the backend

## Next Steps

For production, you'll need to:

1. Add proper Google Client Secret to the backend
2. Implement proper ID token verification
3. Set up proper user creation/login flow
4. Use environment variables for sensitive data 