/**
 * Authentication Service
 *
 * This service handles all authentication logic. Currently it's a mock implementation
 * that simulates user authentication with localStorage. This can be easily swapped
 * with real AWS Cognito implementation without changing the rest of the app.
 *
 * To migrate to Cognito:
 * 1. Replace the mock implementation below with real Cognito calls
 * 2. Keep the same function signatures (login, register, logout, getSession)
 * 3. Update how tokens are stored/retrieved
 */

/**
 * Mock user database - in production this would be AWS Cognito
 */
const MOCK_USERS = [
  {
    id: "user-1",
    email: "admin@health.az.gov",
    password: "password123",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "user-2",
    email: "analyst@health.az.gov",
    password: "password123",
    name: "Analyst User",
    role: "epidemiologist",
  },
];

// Simulate a small delay for API calls
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{access_token: string, user: object}>}
 */
export async function login(email, password) {
  await delay();

  const user = MOCK_USERS.find(
    (u) => u.email === email && u.password === password,
  );

  if (!user) {
    const error = new Error("Invalid email or password");
    error.response = {
      data: {
        detail: "Sign-in failed. Check your email and password.",
      },
    };
    throw error;
  }

  const token = btoa(`${user.email}:${user.id}:${Date.now()}`);
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", JSON.stringify(user));

  return {
    access_token: token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

/**
 * Register a new user
 * @param {object} data - {email, password, name, ...}
 * @returns {Promise<{access_token: string, user: object}>}
 */
export async function register(data) {
  await delay();

  // Check if user already exists
  if (MOCK_USERS.some((u) => u.email === data.email)) {
    const error = new Error("User already exists");
    error.response = {
      data: {
        detail: "An account with this email already exists.",
      },
    };
    throw error;
  }

  // Create new user (in production, Cognito handles this)
  const newUser = {
    id: `user-${Date.now()}`,
    email: data.email,
    password: data.password,
    name: data.name || data.email.split("@")[0],
    role: "epidemiologist", // Default role
  };

  MOCK_USERS.push(newUser);

  const token = btoa(`${newUser.email}:${newUser.id}:${Date.now()}`);
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", JSON.stringify(newUser));

  return {
    access_token: token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    },
  };
}

/**
 * Logout - clear session
 */
export function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

/**
 * Get current session (for restoring auth on page refresh)
 * @returns {Promise<object|null>}
 */
export async function getSession() {
  await delay(100);

  const token = localStorage.getItem("auth_token");
  const userJson = localStorage.getItem("auth_user");

  if (!token || !userJson) {
    return null;
  }

  try {
    const user = JSON.parse(userJson);
    // Verify token is still valid (in production, validate with Cognito)
    return user;
  } catch {
    logout();
    return null;
  }
}

/**
 * Check if user is authenticated
 */
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
