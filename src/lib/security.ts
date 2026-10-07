export function hashPassword(plain: string): string {
  let h = 0x811c9dc5;
  const s = `ranger::${plain}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return `dev1$${(h >>> 0).toString(16).padStart(8, '0')}`;
}
export const verifyPassword = (p: string, h: string) => hashPassword(p) === h;