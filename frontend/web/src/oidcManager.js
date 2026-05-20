import { UserManager, WebStorageStateStore } from "oidc-client-ts";

/**
 * Singleton UserManager shared between AuthProvider (React) and the
 * Axios interceptor (non-React). Both read/write the same token store.
 */
const authority =
  `https://cognito-idp.us-east-2.amazonaws.com/${import.meta.env.VITE_COGNITO_USER_POOL_ID}`;

const userManager = new UserManager({
  authority,
  client_id:    import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: window.location.origin,   // works for both localhost and CloudFront
  response_type: "code",
  scope: "email openid phone",
  userStore: new WebStorageStateStore({ store: window.localStorage }),
});

export default userManager;
