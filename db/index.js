const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'snippets.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    tags TEXT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function getAllSnippets(search = '', language = '') {
  let sql = 'SELECT * FROM snippets WHERE 1=1';
  const params = [];
  
  if (search) {
    sql += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (language && language !== 'all') {
    sql += ' AND language = ?';
    params.push(language);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  return db.prepare(sql).all(...params);
}

function getSnippetById(id) {
  return db.prepare('SELECT * FROM snippets WHERE id = ?').get(id);
}

function createSnippet(title, language, tags, content) {
  const result = db.prepare(
    'INSERT INTO snippets (title, language, tags, content) VALUES (?, ?, ?, ?)'
  ).run(title, language, tags, content);
  
  return getSnippetById(result.lastInsertRowid);
}

function updateSnippet(id, title, language, tags, content) {
  db.prepare(
    'UPDATE snippets SET title = ?, language = ?, tags = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(title, language, tags, content, id);
  
  return getSnippetById(id);
}

function deleteSnippet(id) {
  return db.prepare('DELETE FROM snippets WHERE id = ?').run(id);
}

module.exports = {
  getAllSnippets,
  getSnippetById,
  createSnippet,
  updateSnippet,
  deleteSnippet
};
