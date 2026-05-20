const KEY = "epi_id_token";

export const tokens = {
  get:   ()      => localStorage.getItem(KEY),
  set:   (token) => localStorage.setItem(KEY, token),
  clear: ()      => localStorage.removeItem(KEY),
};

/** Decode a JWT payload without verifying the signature (trust our own backend). */
export function parseJwt(token) {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(b64));
}
