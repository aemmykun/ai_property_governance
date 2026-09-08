const $ = (id) => document.getElementById(id);

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

function addMessage(kind, html) {
  const el = document.createElement('div');
  el.className = `message ${kind}`;
  el.innerHTML = html;
  $('messages').appendChild(el);
  $('messages').scrollTop = $('messages').scrollHeight;
}

async function refreshSources() {
  try {
    const sources = await jsonFetch('/api/sources');
    $('sourceList').innerHTML = sources.length ? sources.map((s) => `
      <article class="source-item">
        <div class="source-head"><strong>${esc(s.title)}</strong><span>${Number(s.chunk_count)} chunks</span></div>
        <div class="meta">${esc(s.publisher || 'Unknown publisher')}${s.version ? ` · ${esc(s.version)}` : ''}</div>
        <a href="${esc(s.source_url)}" target="_blank" rel="noreferrer">${esc(s.source_url)}</a>
        <code>source ${esc(s.id)} · sha256 ${esc(s.content_hash).slice(0, 16)}…</code>
      </article>
    `).join('') : '<p class="empty">No sources ingested yet.</p>';
  } catch (e) {
    $('sourceList').innerHTML = `<p class="error">${esc(e.message)}</p>`;
  }
}

$('ingestForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  button.textContent = 'Indexing…';
  try {
    const result = await jsonFetch('/api/ingest', {
      method: 'POST',
      body: JSON.stringify({
        title: $('title').value,
        sourceUrl: $('sourceUrl').value,
        publisher: $('publisher').value,
        version: $('version').value,
        content: $('content').value
      })
    });
    addMessage('system', `Indexed <strong>${result.chunks}</strong> chunks. Source hash: <code>${esc(result.sourceHash).slice(0, 20)}…</code>`);
    $('content').value = '';
    await refreshSources();
  } catch (e) {
    addMessage('error', esc(e.message));
  } finally {
    button.disabled = false;
    button.textContent = 'Ingest and index';
  }
});

$('askForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = $('question').value.trim();
  if (!question) return;
  const button = event.submitter;
  addMessage('user', esc(question));
  $('question').value = '';
  button.disabled = true;
  button.textContent = 'Retrieving…';
  try {
    const result = await jsonFetch('/api/ask', { method: 'POST', body: JSON.stringify({ question }) });
    const evidence = result.evidence.map((e) => `
      <details class="evidence">
        <summary>[${esc(e.ref)}] ${esc(e.sourceTitle)} · similarity ${e.similarity}</summary>
        <p>${esc(e.excerpt)}</p>
        <a href="${esc(e.sourceUrl)}" target="_blank" rel="noreferrer">Open canonical source</a>
        <code>source ${esc(e.sourceId)} · chunk ${esc(e.chunkId)}</code>
        <code>source sha256 ${esc(e.sourceHash)}</code>
        <code>chunk sha256 ${esc(e.chunkHash)}</code>
      </details>
    `).join('');
    addMessage('assistant', `<div class="answer">${esc(result.answer).replace(/\n/g, '<br>')}</div><div class="evidence-list"><h3>Retrieved evidence</h3>${evidence}</div>`);
  } catch (e) {
    addMessage('error', esc(e.message));
  } finally {
    button.disabled = false;
    button.textContent = 'Ask';
  }
});

$('refreshSources').addEventListener('click', refreshSources);
refreshSources();
