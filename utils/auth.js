// utils/auth.js

// ===== Helpers para cookies (serialize / parse) =====
function serialize(name, val, options = {}) {
  const enc = encodeURIComponent;
  let str = `${name}=${enc(String(val))}`;

  if (options.maxAge != null) str += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.domain) str += `; Domain=${options.domain}`;
  if (options.path) str += `; Path=${options.path}`;
  if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) str += `; HttpOnly`;
  if (options.secure) str += `; Secure`;
  if (options.sameSite) {
    const ss = typeof options.sameSite === 'string' ? options.sameSite : 'Lax';
    str += `; SameSite=${ss[0].toUpperCase()}${ss.slice(1)}`;
  }
  return str;
}

function parse(cookieHeader = '') {
  const out = {};
  cookieHeader.split(';').forEach((part) => {
    const pair = part.trim();
    if (!pair) return;
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  });
  return out;
}

// ===== Nombre y tiempo de vida de la cookie =====
const COOKIE_NAME = 'app_token';
const COOKIE_AGE = 60 * 60 * 24 * 7; // 7 días

// Guarda un objeto como cookie app_token (base64(JSON))
export function setAuthCookie(res, tokenData) {
  const raw = JSON.stringify(tokenData);              // p.ej. { email: 'x@y.com' }
  const encoded = Buffer.from(raw).toString('base64'); // encode base64

  const cookie = serialize(COOKIE_NAME, encoded, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true en producción con https
    path: '/',
    maxAge: COOKIE_AGE,
  });

  res.setHeader('Set-Cookie', cookie);
}

// Borra la cookie de sesión
export function clearAuthCookie(res) {
  const cookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: false,
    maxAge: 0,
    expires: new Date(0),
  });
  res.setHeader('Set-Cookie', cookie);
}

// Lee y decodifica la cookie app_token → { email: '...' }
export function getTokenFromReq(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = parse(cookieHeader);

  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;

  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded); // { email: '...' }
  } catch {
    return null;
  }
}
