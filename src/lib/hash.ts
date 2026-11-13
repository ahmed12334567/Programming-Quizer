/**
 * Computes a lowercase hex SHA-256 hash using the browser's native Web Crypto API.
 */
export async function sha256Hex(plainText: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const digestBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const byteArray = Array.from(new Uint8Array(digestBuffer));
    return byteArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('Web Crypto API is not available in this environment.');
}
