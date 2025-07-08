import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcrypt';

let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function initUserDb() {
  db = await open({
    filename: './users.db',
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function createUser(email: string, password: string, role: string = 'user') {
  const hash = await bcrypt.hash(password, 10);
  await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hash, role]);
}

export async function findUserByEmail(email: string) {
  return db.get('SELECT * FROM users WHERE email = ?', [email]);
}

export async function updateUserStatus(email: string, status: string) {
  await db.run('UPDATE users SET status = ? WHERE email = ?', [status, email]);
}

export async function updateUserPassword(email: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  await db.run('UPDATE users SET password = ? WHERE email = ?', [hash, email]);
} 