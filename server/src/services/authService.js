import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors.js';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

/**
 * Generate a signed JWT for the given user.
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );
}

/**
 * Register a new user.
 */
export async function register({ email, password, name, role = 'waiter' }) {
  // Check for duplicate email
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ConflictError('A user with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, role, created_at`,
    [email, passwordHash, name, role],
  );

  const user = result.rows[0];
  return { user, token: signToken(user) };
}

/**
 * Authenticate a user by email + password.
 */
export async function login({ email, password }) {
  const result = await query(
    'SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = $1',
    [email],
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token: signToken(safeUser) };
}

/**
 * Get the current user's profile.
 */
export async function getProfile(userId) {
  const result = await query(
    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
    [userId],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  return result.rows[0];
}

/**
 * List all users (useful for assigning collaborators, dashboard breakdowns).
 */
export async function listUsers() {
  const result = await query(
    'SELECT id, email, name, role, created_at FROM users ORDER BY name',
  );
  return result.rows;
}
