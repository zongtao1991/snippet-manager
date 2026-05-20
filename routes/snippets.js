const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const { search, language } = req.query;
    const snippets = db.getAllSnippets(search || '', language || '');
    res.json(snippets);
  } catch (error) {
    console.error('Error getting snippets:', error);
    res.status(500).json({ error: 'Failed to get snippets' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const snippet = db.getSnippetById(req.params.id);
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }
    res.json(snippet);
  } catch (error) {
    console.error('Error getting snippet:', error);
    res.status(500).json({ error: 'Failed to get snippet' });
  }
});

router.post('/', (req, res) => {
  try {
    const { title, language, tags, content } = req.body;
    
    if (!title || !language || !content) {
      return res.status(400).json({ error: 'Title, language and content are required' });
    }
    
    const snippet = db.createSnippet(title, language, tags || '', content);
    res.status(201).json(snippet);
  } catch (error) {
    console.error('Error creating snippet:', error);
    res.status(500).json({ error: 'Failed to create snippet' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { title, language, tags, content } = req.body;
    
    if (!title || !language || !content) {
      return res.status(400).json({ error: 'Title, language and content are required' });
    }
    
    const snippet = db.getSnippetById(req.params.id);
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }
    
    const updatedSnippet = db.updateSnippet(req.params.id, title, language, tags || '', content);
    res.json(updatedSnippet);
  } catch (error) {
    console.error('Error updating snippet:', error);
    res.status(500).json({ error: 'Failed to update snippet' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const snippet = db.getSnippetById(req.params.id);
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }
    
    db.deleteSnippet(req.params.id);
    res.json({ message: 'Snippet deleted successfully' });
  } catch (error) {
    console.error('Error deleting snippet:', error);
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
});

module.exports = router;
