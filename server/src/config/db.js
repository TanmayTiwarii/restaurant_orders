import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const isLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

/**
 * Execute a parameterised SQL query.
 * @param {string} text  — SQL string with $1, $2, … placeholders
 * @param {any[]}  params — values bound to the placeholders
 * @returns {import('pg').QueryResult}
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Acquire a client for transaction support.
 * Caller is responsible for calling client.release().
 */
export const getClient = () => pool.connect();

export default pool;
