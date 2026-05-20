const express = require('express');
const path = require('path');
const snippetsRouter = require('./routes/snippets');

const app = express();
const PORT = 7741;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/snippets', snippetsRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Snippet Manager server running on http://localhost:${PORT}`);
});
