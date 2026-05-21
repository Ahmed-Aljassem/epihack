# AWS Cognito Migration Guide

## Overview

The authentication system is currently using a **mock implementation** in `frontend/src/services/authService.js`. This was designed to be easily swappable with real AWS Cognito integration.

## Current State

- **Mock implementation**: Simulates user auth with `localStorage`
- **No backend dependency**: Works completely client-side
- **Test credentials**:
  - Email: `admin@health.az.gov` / Password: `password123` (admin)
  - Email: `analyst@health.az.gov` / Password: `password123` (analyst)

## Migrating to AWS Cognito

### Step 1: Install AWS Amplify

```bash
cd frontend
npm install aws-amplify
```

### Step 2: Configure Cognito in your environment

Create `frontend/.env.local` (or update `.env`):

```env
VITE_AWS_REGION=us-west-2
VITE_COGNITO_USER_POOL_ID=us-west-2_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
VITE_COGNITO_DOMAIN=onehealth-az.auth.us-west-2.amazoncognito.com
```

### Step 3: Replace `authService.js` with Cognito implementation

**Here's a template to replace the mock implementation:**

```javascript
import { Auth } from "aws-amplify";

// Configure Amplify
Auth.configure({
  region: import.meta.env.VITE_AWS_REGION,
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
});

export async function login(email, password) {
  try {
    const user = await Auth.signIn(email, password);
    const token = user.signInUserSession.idToken.jwtToken;
    localStorage.setItem("auth_token", token);

    const userData = {
      id: user.username,
      email: user.attributes.email,
      name: user.attributes.name,
      role: user.attributes["custom:role"] || "epidemiologist",
    };

    localStorage.setItem("auth_user", JSON.stringify(userData));
    return { access_token: token, user: userData };
  } catch (error) {
    const err = new Error(error.message);
    err.response = { data: { detail: error.message } };
    throw err;
  }
}

export async function register(data) {
  try {
    await Auth.signUp({
      username: data.email,
      password: data.password,
      attributes: {
        email: data.email,
        name: data.name,
        "custom:role": "epidemiologist",
        "custom:agency": data.agency || "",
        "custom:phone": data.phone || "",
      },
    });

    // Auto-confirm for development, or require email verification
    // In production, you'd ask user to verify email first
    const user = await Auth.signIn(data.email, data.password);
    const token = user.signInUserSession.idToken.jwtToken;
    localStorage.setItem("auth_token", token);

    const userData = {
      id: user.username,
      email: user.attributes.email,
      name: user.attributes.name,
      role: "epidemiologist",
    };

    localStorage.setItem("auth_user", JSON.stringify(userData));
    return { access_token: token, user: userData };
  } catch (error) {
    const err = new Error(error.message);
    err.response = { data: { detail: error.message } };
    throw err;
  }
}

export function logout() {
  Auth.signOut();
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

export async function getSession() {
  try {
    const session = await Auth.currentSession();
    const user = await Auth.currentAuthenticatedUser();

    return {
      id: user.username,
      email: user.attributes.email,
      name: user.attributes.name,
      role: user.attributes["custom:role"] || "epidemiologist",
    };
  } catch (error) {
    logout();
    return null;
  }
}

export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}

export default {
  login,
  register,
  logout,
  getSession,
  isAuthenticated,
};
```

### Step 4: Update Cognito User Pool Schema (AWS Console)

Add custom attributes to your Cognito User Pool:

1. Go to AWS Cognito → User Pools → Your Pool → Attributes
2. Add custom attributes:
   - `role` (String, mutable)
   - `agency` (String, mutable)
   - `phone` (Number, mutable)

### Step 5: Handle Email Verification

In production, you'll want to handle email verification. Modify the register function to:

- Require email confirmation before login
- Send verification codes
- Handle password resets via email

### Step 6: Test Integration

1. Make sure AuthContext works the same way
2. Test login/register flows
3. Verify user roles are properly set
4. Test session persistence on page refresh

## Key Points

- **No changes needed in UI components** - AuthContext interface remains the same
- **LoginPage, RegisterPage, and all protected routes continue working** - they just use Cognito instead of mock auth
- **Error handling is compatible** - Cognito errors are formatted the same way
- **localStorage structure is the same** - migration is transparent to the rest of the app

## Notes

- Remove mock users from authService.js once Cognito is live
- Consider adding password reset flows
- Implement MFA if needed
- Set up proper CORS for your Cognito domain in API Gateway (if using API backend)
