const API_BASE = '/api/snippets';

let snippets = [];
let currentSnippetToDelete = null;
let searchTimeout = null;

const elements = {
  newBtn: document.getElementById('newBtn'),
  searchInput: document.getElementById('searchInput'),
  languageFilter: document.getElementById('languageFilter'),
  formContainer: document.getElementById('formContainer'),
  formTitle: document.getElementById('formTitle'),
  closeForm: document.getElementById('closeForm'),
  snippetForm: document.getElementById('snippetForm'),
  snippetId: document.getElementById('snippetId'),
  title: document.getElementById('title'),
  language: document.getElementById('language'),
  tags: document.getElementById('tags'),
  content: document.getElementById('content'),
  cancelBtn: document.getElementById('cancelBtn'),
  snippetList: document.getElementById('snippetList'),
  emptyState: document.getElementById('emptyState'),
  deleteModal: document.getElementById('deleteModal'),
  confirmDelete: document.getElementById('confirmDelete'),
  cancelDelete: document.getElementById('cancelDelete')
};

async function fetchSnippets() {
  try {
    const search = elements.searchInput.value.trim();
    const language = elements.languageFilter.value;
    
    let url = API_BASE;
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (language !== 'all') params.append('language', language);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    const response = await fetch(url);
    snippets = await response.json();
    renderSnippets();
  } catch (error) {
    console.error('Error fetching snippets:', error);
  }
}

function renderSnippets() {
  if (snippets.length === 0) {
    elements.snippetList.innerHTML = '';
    elements.emptyState.classList.remove('hidden');
    return;
  }
  
  elements.emptyState.classList.add('hidden');
  
  elements.snippetList.innerHTML = snippets.map(snippet => `
    <div class="snippet-card" data-id="${snippet.id}">
      <div class="snippet-header">
        <div class="snippet-title">${escapeHtml(snippet.title)}</div>
        <div class="snippet-meta">
          <span class="language-tag language-${snippet.language}">${snippet.language}</span>
          <span class="snippet-date">${formatDate(snippet.created_at)}</span>
        </div>
      </div>
      <div class="snippet-content">
        <pre class="snippet-preview">${getCodePreview(snippet.content)}</pre>
      </div>
      ${renderTags(snippet.tags)}
      <div class="snippet-actions">
        <button class="btn btn-small copy-btn" data-id="${snippet.id}" data-content="${escapeHtml(snippet.content)}">复制代码</button>
        <button class="btn btn-small btn-secondary edit-btn" data-id="${snippet.id}">编辑</button>
        <button class="btn btn-small btn-danger delete-btn" data-id="${snippet.id}">删除</button>
      </div>
    </div>
  `).join('');
  
  attachCardListeners();
}

function renderTags(tagsStr) {
  if (!tagsStr || tagsStr.trim() === '') return '';
  
  const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
  
  if (tags.length === 0) return '';
  
  return `<div class="snippet-tags">
    ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
  </div>`;
}

function getCodePreview(content) {
  const lines = content.split('\n').slice(0, 3);
  const preview = lines.join('\n');
  return escapeHtml(preview) + (content.split('\n').length > 3 ? '\n...' : '');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function attachCardListeners() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const content = btn.getAttribute('data-content');
      copyToClipboard(content, btn);
    });
  });
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      editSnippet(id);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      showDeleteModal(id);
    });
  });
  
  document.querySelectorAll('.snippet-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const id = parseInt(card.getAttribute('data-id'));
      editSnippet(id);
    });
  });
}

function copyToClipboard(text, btn) {
  function showCopied() {
    btn.textContent = '已复制 ✓';
    btn.classList.add('copied');
    
    setTimeout(() => {
      btn.textContent = '复制代码';
      btn.classList.remove('copied');
    }, 2000);
  }
  
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(showCopied)
      .catch((error) => {
        console.warn('Clipboard API failed, trying fallback:', error);
        fallbackCopy(text, showCopied);
      });
  } else {
    fallbackCopy(text, showCopied);
  }
}

function fallbackCopy(text, onSuccess) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (error) {
    console.error('Fallback copy failed:', error);
  }
  
  document.body.removeChild(textarea);
  
  if (success) {
    onSuccess();
  } else {
    alert('复制失败，请手动复制');
  }
}

function showForm(isEdit = false) {
  elements.formTitle.textContent = isEdit ? '编辑代码片段' : '新建代码片段';
  elements.formContainer.classList.remove('hidden');
}

function hideForm() {
  elements.snippetForm.reset();
  elements.snippetId.value = '';
  elements.formContainer.classList.add('hidden');
}

function editSnippet(id) {
  const snippet = snippets.find(s => s.id === id);
  if (!snippet) return;
  
  elements.snippetId.value = snippet.id;
  elements.title.value = snippet.title;
  elements.language.value = snippet.language;
  elements.tags.value = snippet.tags || '';
  elements.content.value = snippet.content;
  
  showForm(true);
}

function showDeleteModal(id) {
  currentSnippetToDelete = id;
  elements.deleteModal.classList.remove('hidden');
}

function hideDeleteModal() {
  currentSnippetToDelete = null;
  elements.deleteModal.classList.add('hidden');
}

async function deleteSnippet(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      hideDeleteModal();
      fetchSnippets();
    } else {
      alert('删除失败');
    }
  } catch (error) {
    console.error('Error deleting snippet:', error);
    alert('删除失败');
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = elements.snippetId.value;
  const snippetData = {
    title: elements.title.value.trim(),
    language: elements.language.value,
    tags: elements.tags.value.trim(),
    content: elements.content.value
  };
  
  try {
    let response;
    
    if (id) {
      response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snippetData)
      });
    } else {
      response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snippetData)
      });
    }
    
    if (response.ok) {
      hideForm();
      fetchSnippets();
    } else {
      const error = await response.json();
      alert(error.error || '保存失败');
    }
  } catch (error) {
    console.error('Error saving snippet:', error);
    alert('保存失败');
  }
}

function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    fetchSnippets();
  }, 300);
}

elements.newBtn.addEventListener('click', () => {
  hideForm();
  showForm(false);
});

elements.closeForm.addEventListener('click', hideForm);
elements.cancelBtn.addEventListener('click', hideForm);
elements.snippetForm.addEventListener('submit', handleFormSubmit);

elements.searchInput.addEventListener('input', handleSearch);
elements.languageFilter.addEventListener('change', fetchSnippets);

elements.confirmDelete.addEventListener('click', () => {
  if (currentSnippetToDelete) {
    deleteSnippet(currentSnippetToDelete);
  }
});

elements.cancelDelete.addEventListener('click', hideDeleteModal);

elements.deleteModal.addEventListener('click', (e) => {
  if (e.target === elements.deleteModal) {
    hideDeleteModal();
  }
});

fetchSnippets();
