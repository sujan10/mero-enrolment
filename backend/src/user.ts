import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcrypt';

let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function initUserDb() {
  db = await open({
    filename: './users.db',
    driver: sqlite3.Database
  });
  
  // Create all tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      is_draft BOOLEAN DEFAULT 1,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pdf_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      blob_url TEXT,
      file_size INTEGER,
      pages INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS form_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      form_field_id TEXT NOT NULL,
      pdf_field_id TEXT NOT NULL,
      pdf_file_id INTEGER NOT NULL,
      is_repeated BOOLEAN DEFAULT 0,
      repeated_pages TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
      FOREIGN KEY (pdf_file_id) REFERENCES pdf_files (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS form_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      field_name TEXT NOT NULL,
      field_label TEXT NOT NULL,
      field_type TEXT NOT NULL,
      required BOOLEAN DEFAULT 0,
      placeholder TEXT,
      options TEXT,
      validation_rules TEXT,
      field_group TEXT,
      field_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    );
  `);
}

// User management functions
export async function createUser(email: string, password: string, role: string = 'user') {
  const hash = await bcrypt.hash(password, 10);
  await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hash, role]);
}

export async function findUserByEmail(email: string) {
  return db.get('SELECT * FROM users WHERE email = ?', [email]);
}

export async function findUserById(id: number) {
  return db.get('SELECT * FROM users WHERE id = ?', [id]);
}

export async function updateUserStatus(email: string, status: string) {
  await db.run('UPDATE users SET status = ? WHERE email = ?', [status, email]);
}

export async function updateUserPassword(email: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  await db.run('UPDATE users SET password = ? WHERE email = ?', [hash, email]);
}

// Workspace management functions
export async function createWorkspace(name: string, userId: number) {
  const result = await db.run(
    'INSERT INTO workspaces (name, user_id) VALUES (?, ?)',
    [name, userId]
  );
  return result.lastID;
}

export async function getWorkspacesByUserId(userId: number) {
  return db.all(`
    SELECT w.*, 
           COUNT(DISTINCT pf.id) as pdf_count,
           COUNT(DISTINCT ff.id) as form_fields_count
    FROM workspaces w
    LEFT JOIN pdf_files pf ON w.id = pf.workspace_id
    LEFT JOIN form_fields ff ON w.id = ff.workspace_id
    WHERE w.user_id = ?
    GROUP BY w.id
    ORDER BY w.updated_at DESC
  `, [userId]);
}

export async function getWorkspaceById(workspaceId: number, userId: number) {
  return db.get(`
    SELECT w.*, 
           COUNT(DISTINCT pf.id) as pdf_count,
           COUNT(DISTINCT ff.id) as form_fields_count
    FROM workspaces w
    LEFT JOIN pdf_files pf ON w.id = pf.workspace_id
    LEFT JOIN form_fields ff ON w.id = ff.workspace_id
    WHERE w.id = ? AND w.user_id = ?
    GROUP BY w.id
  `, [workspaceId, userId]);
}

export async function updateWorkspace(workspaceId: number, updates: any) {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(workspaceId);
  
  await db.run(`UPDATE workspaces SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
}

export async function deleteWorkspace(workspaceId: number, userId: number) {
  await db.run('DELETE FROM workspaces WHERE id = ? AND user_id = ?', [workspaceId, userId]);
}

// PDF file management functions
export async function createPdfFile(workspaceId: number, userId: number, fileName: string, originalName: string, blobUrl?: string, fileSize?: number, pages?: number) {
  const result = await db.run(`
    INSERT INTO pdf_files (workspace_id, user_id, file_name, original_name, blob_url, file_size, pages)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [workspaceId, userId, fileName, originalName, blobUrl, fileSize, pages]);
  return result.lastID;
}

export async function getPdfFilesByWorkspaceId(workspaceId: number, userId: number) {
  return db.all(`
    SELECT pf.* FROM pdf_files pf
    JOIN workspaces w ON pf.workspace_id = w.id
    WHERE pf.workspace_id = ? AND w.user_id = ?
    ORDER BY pf.uploaded_at DESC
  `, [workspaceId, userId]);
}

export async function deletePdfFile(pdfFileId: number, userId: number) {
  await db.run(`
    DELETE FROM pdf_files 
    WHERE id = ? AND user_id = ?
  `, [pdfFileId, userId]);
}

// Form field management functions
export async function createFormField(workspaceId: number, fieldData: any) {
  const result = await db.run(`
    INSERT INTO form_fields (
      workspace_id, field_name, field_label, field_type, required, 
      placeholder, options, validation_rules, field_group, field_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    workspaceId, fieldData.name, fieldData.label, fieldData.type, fieldData.required,
    fieldData.placeholder, JSON.stringify(fieldData.options), JSON.stringify(fieldData.validation),
    fieldData.group, fieldData.order
  ]);
  return result.lastID;
}

export async function getFormFieldsByWorkspaceId(workspaceId: number, userId: number) {
  const fields = await db.all(`
    SELECT ff.* FROM form_fields ff
    JOIN workspaces w ON ff.workspace_id = w.id
    WHERE ff.workspace_id = ? AND w.user_id = ?
    ORDER BY ff.field_order
  `, [workspaceId, userId]);
  
  return fields.map(field => ({
    ...field,
    options: field.options ? JSON.parse(field.options) : undefined,
    validation: field.validation_rules ? JSON.parse(field.validation_rules) : undefined
  }));
}

export async function updateFormField(fieldId: number, updates: any) {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(fieldId);
  
  await db.run(`UPDATE form_fields SET ${fields} WHERE id = ?`, values);
}

export async function deleteFormField(fieldId: number, userId: number) {
  await db.run(`
    DELETE FROM form_fields 
    WHERE id = ? AND workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = ?
    )
  `, [fieldId, userId]);
}

// Form mapping management functions
export async function createFormMapping(workspaceId: number, formFieldId: string, pdfFieldId: string, pdfFileId: number, isRepeated: boolean = false, repeatedPages?: number[]) {
  const result = await db.run(`
    INSERT INTO form_mappings (workspace_id, form_field_id, pdf_field_id, pdf_file_id, is_repeated, repeated_pages)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [workspaceId, formFieldId, pdfFieldId, pdfFileId, isRepeated, JSON.stringify(repeatedPages)]);
  return result.lastID;
}

export async function getFormMappingsByWorkspaceId(workspaceId: number, userId: number) {
  const mappings = await db.all(`
    SELECT fm.* FROM form_mappings fm
    JOIN workspaces w ON fm.workspace_id = w.id
    WHERE fm.workspace_id = ? AND w.user_id = ?
  `, [workspaceId, userId]);
  
  return mappings.map(mapping => ({
    ...mapping,
    repeated_pages: mapping.repeated_pages ? JSON.parse(mapping.repeated_pages) : undefined
  }));
}

export async function deleteFormMapping(mappingId: number, userId: number) {
  await db.run(`
    DELETE FROM form_mappings 
    WHERE id = ? AND workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = ?
    )
  `, [mappingId, userId]);
} 