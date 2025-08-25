// src/utils/jwt.js
// Tiny helper to read claims from a JWT (no backend needed)

function b64UrlToB64(input) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  return base64 + "=".repeat(padLen);
}

function b64DecodeUnicode(str) {
  try {
    const bin = atob(str);
    // Handle unicode safely
    const percentEncoded = Array.prototype.map
      .call(bin, (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("");
    return decodeURIComponent(percentEncoded);
  } catch {
    // Fallback (most JWT payloads are ASCII anyway)
    return atob(str);
  }
}

export function decodeJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payloadB64 = b64UrlToB64(parts[1]);
    const json = b64DecodeUnicode(payloadB64);
    return JSON.parse(json); // e.g., { sub: "username", exp: 1234567890, ... }
  } catch {
    return null;
  }
}
