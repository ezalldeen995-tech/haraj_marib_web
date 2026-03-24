// app.js — Core logic for API documentation page
(function() {
  'use strict';

  const STORAGE_KEYS = {
    BASE_URLS: 'haraj_doc_base_urls',
    ACTIVE_BASE_URL: 'haraj_doc_active_base_url',
    TOKENS: 'haraj_doc_tokens',
    ACTIVE_TOKEN: 'haraj_doc_active_token',
    RESPONSES: 'haraj_doc_responses'
  };

  const GROUP_ICONS = {
    'Auth': '🔐', 'User Profile': '👤', 'Ads': '📦', 'Chat': '💬',
    'Payments': '💳', 'Comments': '💭', 'Ratings': '⭐', 'Favorites': '❤️',
    'Blocks': '🚫', 'Contact': '📧', 'Admin': '🛡️'
  };

  // ── Helpers ──
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }
  function getStorage(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
  function setStorage(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  function syntaxHighlight(json) {
    if (typeof json !== 'string') json = JSON.stringify(json, null, 2);
    return json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, function(m) {
        let cls = 'json-string';
        if (/:\s*$/.test(m)) cls = 'json-key';
        return '<span class="' + cls + '">' + m + '</span>';
      })
      .replace(/\b(true|false)\b/g, '<span class="json-bool">$1</span>')
      .replace(/\bnull\b/g, '<span class="json-null">null</span>')
      .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="json-num">$1</span>');
  }

  function countLines(str) { return str.split('\n').length; }

  // ── Build Sidebar ──
  function buildSidebar() {
    const nav = $('#sidebar-nav');
    const groups = {};
    API_ENDPOINTS.forEach(ep => {
      if (!groups[ep.group]) groups[ep.group] = [];
      groups[ep.group].push(ep);
    });

    let html = '';
    for (const [group, endpoints] of Object.entries(groups)) {
      html += `<div class="nav-group">
        <div class="nav-group-title" onclick="this.parentElement.classList.toggle('collapsed')">
          <span>${GROUP_ICONS[group] || '📄'} ${group}</span>
          <span class="count">${endpoints.length}</span>
        </div>
        <div class="nav-items">`;
      endpoints.forEach(ep => {
        html += `<a class="nav-item" href="#${ep.id}" data-id="${ep.id}">
          <span class="method-badge method-${ep.method}">${ep.method}</span>
          <span>${ep.path.replace('/api/v1/', '')}</span>
        </a>`;
      });
      html += '</div></div>';
    }
    nav.innerHTML = html;
  }

  // ── Build Main Content ──
  function buildContent() {
    const main = $('#main-content');
    const groups = {};
    API_ENDPOINTS.forEach(ep => {
      if (!groups[ep.group]) groups[ep.group] = [];
      groups[ep.group].push(ep);
    });

    let html = '';
    for (const [group, endpoints] of Object.entries(groups)) {
      html += `<div class="endpoint-group" id="group-${group.replace(/\s/g,'-')}">
        <h2 class="group-title"><span class="group-icon">${GROUP_ICONS[group] || '📄'}</span> ${group}</h2>`;
      endpoints.forEach(ep => {
        html += buildEndpointCard(ep);
      });
      html += '</div>';
    }
    main.innerHTML = html;

    // Attach toggle handlers
    $$('.endpoint-header').forEach(h => {
      h.addEventListener('click', e => {
        if (e.target.closest('.btn-run')) return;
        const body = h.nextElementSibling;
        body.classList.toggle('open');
        h.querySelector('.toggle-icon').textContent = body.classList.contains('open') ? '▾' : '▸';
      });
    });

    // Attach code toggle handlers
    $$('.code-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const block = btn.previousElementSibling;
        block.classList.toggle('collapsed');
        btn.textContent = block.classList.contains('collapsed') ? '▼ Show More' : '▲ Show Less';
      });
    });
  }

  function buildEndpointCard(ep) {
    const authBadge = ep.adminOnly
      ? '<span class="auth-badge admin">🛡️ Admin</span>'
      : ep.auth
        ? '<span class="auth-badge required">🔒 Auth</span>'
        : '<span class="auth-badge public">🌐 Public</span>';

    const contentTypeBadge = ep.contentType
      ? `<span class="content-type-badge">${ep.contentType}</span>` : '';

    let bodyHtml = '';

    // Request body
    if (ep.body) {
      bodyHtml += `<div class="section-title">📤 Request Body ${contentTypeBadge}</div>`;
      bodyHtml += '<table class="params-table"><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Nullable</th><th>Example</th><th>Note</th></tr></thead><tbody>';
      for (const [key, field] of Object.entries(ep.body)) {
        const reqLabel = field.required
          ? '<span class="param-required">Required</span>'
          : '<span class="param-optional">Optional</span>';
        const nullLabel = field.nullable
          ? '<span class="param-nullable">Yes</span>'
          : '<span style="color:var(--text-muted);font-size:11px">No</span>';
        bodyHtml += `<tr>
          <td><span class="param-name">${key}</span></td>
          <td><span class="param-type">${field.type}</span></td>
          <td>${reqLabel}</td>
          <td>${nullLabel}</td>
          <td><span class="param-example">${field.example}</span></td>
          <td><span class="param-note">${field.note || ''}</span></td>
        </tr>`;
      }
      bodyHtml += '</tbody></table>';
    }

    // Query params note
    if (ep.params) {
      bodyHtml += `<div class="section-title">🔍 Query Parameters</div>`;
      bodyHtml += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
      ep.params.forEach(p => {
        bodyHtml += `<span style="padding:3px 10px;background:var(--bg-code);border:1px solid var(--border);border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--accent);">${p}</span>`;
      });
      bodyHtml += '</div>';
    }

    // Responses
    if (ep.responses) {
      bodyHtml += '<div class="section-title">📥 Responses</div>';
      for (const [key, resp] of Object.entries(ep.responses)) {
        const isSuccess = key.startsWith('success');
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const jsonStr = JSON.stringify(resp.body, null, 2);
        const lines = countLines(jsonStr);
        const collapsed = lines > 8 ? 'collapsed' : '';

        bodyHtml += `
          <span class="status-label ${isSuccess ? 'status-success' : 'status-error'}">
            ${isSuccess ? '✓' : '✗'} ${resp.status} — ${label}
          </span>
          <div class="code-block-wrapper">
            <pre class="code-block ${collapsed}">${syntaxHighlight(jsonStr)}</pre>
            ${lines > 8 ? '<button class="code-toggle-btn">▼ Show More</button>' : ''}
          </div>`;
      }
    }

    // Nullable fields
    if (ep.nullableFields && ep.nullableFields.length) {
      bodyHtml += '<div class="section-title">⚠️ Nullable Fields</div>';
      bodyHtml += '<ul class="nullable-list">';
      ep.nullableFields.forEach(f => { bodyHtml += `<li>${f}</li>`; });
      bodyHtml += '</ul>';
    }

    return `
      <div class="endpoint-card" id="${ep.id}">
        <div class="endpoint-header">
          <span class="method-badge method-${ep.method}">${ep.method}</span>
          <span class="endpoint-path">${ep.path}</span>
          <div class="endpoint-badges">
            ${authBadge}
            <button class="btn-run" onclick="event.stopPropagation();openTestDialog('${ep.id}')">▶ Run</button>
          </div>
          <span class="toggle-icon" style="color:var(--text-muted);font-size:12px;">▸</span>
          <div class="endpoint-summary">${ep.summary}</div>
        </div>
        <div class="endpoint-body">${bodyHtml}</div>
      </div>`;
  }

  // ── Search ──
  function initSearch() {
    const input = $('#search-input');
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      $$('.endpoint-card').forEach(card => {
        const id = card.id;
        const ep = API_ENDPOINTS.find(e => e.id === id);
        const match = !q || ep.path.toLowerCase().includes(q) || ep.summary.toLowerCase().includes(q) || ep.group.toLowerCase().includes(q) || ep.method.toLowerCase().includes(q);
        card.style.display = match ? '' : 'none';
      });
      $$('.nav-item').forEach(item => {
        const id = item.dataset.id;
        const ep = API_ENDPOINTS.find(e => e.id === id);
        const match = !q || ep.path.toLowerCase().includes(q) || ep.summary.toLowerCase().includes(q) || ep.group.toLowerCase().includes(q);
        item.style.display = match ? '' : 'none';
      });
      $$('.endpoint-group').forEach(grp => {
        const visibleCards = grp.querySelectorAll('.endpoint-card[style=""], .endpoint-card:not([style])');
        grp.style.display = visibleCards.length ? '' : 'none';
      });
    });
  }

  // ── Sidebar active state ──
  function initNavHighlight() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$('.nav-item').forEach(n => n.classList.remove('active'));
          const navItem = $(`.nav-item[data-id="${entry.target.id}"]`);
          if (navItem) navItem.classList.add('active');
        }
      });
    }, { rootMargin: '-100px 0px -60% 0px' });
    $$('.endpoint-card').forEach(card => observer.observe(card));
  }

  // ═══════════════════════════════════
  // ── TEST DIALOG ──
  // ═══════════════════════════════════
  window.openTestDialog = function(epId) {
    const ep = API_ENDPOINTS.find(e => e.id === epId);
    const config = TEST_CONFIG[epId] || {};
    const overlay = $('#dialog-overlay');
    const dialog = $('#dialog');

    renderDialog(ep, config);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeTestDialog = function() {
    $('#dialog-overlay').classList.remove('open');
    document.body.style.overflow = '';
  };

  // Close on overlay click
  document.addEventListener('click', e => {
    if (e.target.id === 'dialog-overlay') closeTestDialog();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeTestDialog();
  });

  function renderDialog(ep, config) {
    const body = $('#dialog-body');
    const header = $('#dialog-header-title');
    header.innerHTML = `<span class="method-badge method-${ep.method}">${ep.method}</span> ${ep.path}`;

    let html = '';

    // ── Base URL ──
    const savedUrls = getStorage(STORAGE_KEYS.BASE_URLS, ['http://localhost:8000']);
    const activeUrl = getStorage(STORAGE_KEYS.ACTIVE_BASE_URL, savedUrls[0] || 'http://localhost:8000');
    html += `<div class="config-section">
      <div class="config-section-title">🌐 Base URL</div>
      <div class="config-row">
        <input type="text" id="dlg-base-url" value="${activeUrl}" placeholder="https://api.example.com">
        <button class="btn-save-config" onclick="saveBaseUrl()">+ Save</button>
      </div>
      <div class="saved-items" id="saved-urls">${renderSavedUrls(savedUrls, activeUrl)}</div>
    </div>`;

    // ── Token ──
    const savedTokens = getStorage(STORAGE_KEYS.TOKENS, []);
    const activeToken = getStorage(STORAGE_KEYS.ACTIVE_TOKEN, '');
    html += `<div class="config-section">
      <div class="config-section-title">🔑 Authorization Token</div>
      <div class="config-row">
        <input type="text" id="dlg-token" value="${activeToken}" placeholder="Bearer token...">
        <button class="btn-save-config" onclick="saveToken()">+ Save</button>
      </div>
      <div class="saved-items" id="saved-tokens">${renderSavedTokens(savedTokens, activeToken)}</div>
    </div>`;

    // Build the full URL display
    let currentPath = ep.path;
    html += `<div class="config-section">
      <div class="config-section-title">📡 Request URL</div>
      <div class="url-bar">
        <span class="method-label method-${ep.method}">${ep.method}</span>
        <span class="url-display" id="dlg-full-url">${activeUrl}${currentPath}</span>
      </div>
    </div>`;

    // ── Path Params ──
    if (config.pathParams) {
      html += `<div class="config-section">
        <div class="config-section-title">📎 Path Parameters</div>`;
      config.pathParams.forEach(p => {
        html += `<div class="param-row">
          <span class="param-label">{${p.name}}</span>
          <input class="param-value path-param" data-name="${p.name}" value="${p.defaultValue}" oninput="updateDialogUrl()">
        </div>
        <div class="param-suggestions">${p.suggestions.map(s => `<span class="param-suggestion" onclick="selectPathParam('${p.name}','${s}')">${s}</span>`).join('')}</div>`;
      });
      html += '</div>';
    }

    // ── Query Params ──
    if (config.queryParams) {
      // Presets
      if (config.presets) {
        html += `<div class="config-section">
          <div class="config-section-title">⚡ Quick Presets</div>
          <div class="presets-row">${config.presets.map((pr, i) => `<button class="preset-btn" onclick="applyPreset(${i})">${pr.name}</button>`).join('')}</div>
        </div>`;
      }

      html += `<div class="config-section">
        <div class="config-section-title">🔧 Query Parameters</div>`;
      config.queryParams.forEach(p => {
        html += `<div class="param-row">
          <input type="checkbox" class="query-check" data-name="${p.name}" ${p.enabled ? 'checked' : ''} onchange="updateDialogUrl()">
          <span class="param-label">${p.name}</span>
          <input class="param-value query-param" data-name="${p.name}" value="${p.defaultValue}" oninput="updateDialogUrl()">
        </div>
        <div class="param-suggestions">${p.suggestions.map(s => `<span class="param-suggestion" onclick="selectQueryParam('${p.name}','${s}')">${s}</span>`).join('')}</div>`;
      });
      html += '</div>';
    }

    // ── Body ──
    if (config.defaultBody || (ep.body && ep.method !== 'GET')) {
      const bodyJson = JSON.stringify(config.defaultBody || {}, null, 2);
      html += `<div class="config-section">
        <div class="config-section-title">📤 Request Body</div>
        ${config.notes ? `<div style="font-size:11px;color:var(--orange);margin-bottom:6px;">⚠ ${config.notes}</div>` : ''}
        <div class="config-row">
          <textarea id="dlg-body">${bodyJson}</textarea>
        </div>
      </div>`;
    }

    // ── Send Button ──
    html += `<button class="btn-send" id="btn-send" onclick="sendRequest('${ep.id}')">▶ Send Request</button>`;

    // ── Response Area ──
    const savedResp = getStorage(STORAGE_KEYS.RESPONSES, {})[ep.id];
    html += `<div class="response-section" id="response-section">`;
    if (savedResp) {
      html += renderResponse(savedResp);
    }
    html += '</div>';

    body.innerHTML = html;

    // Store current EP data on dialog
    dialog.dataset.epId = ep.id;
    dialog.dataset.epMethod = ep.method;
    dialog.dataset.epPath = ep.path;

    // Store presets if any
    if (config.presets) window._currentPresets = config.presets;
    if (config.queryParams) window._currentQueryParams = config.queryParams;

    updateDialogUrl();
  }

  function renderSavedUrls(urls, active) {
    return urls.map(u =>
      `<span class="saved-item ${u===active?'active':''}" onclick="selectBaseUrl('${u}')">
        ${u} <span class="remove" onclick="event.stopPropagation();removeBaseUrl('${u}')">×</span>
      </span>`
    ).join('');
  }

  function renderSavedTokens(tokens, active) {
    return tokens.map(t =>
      `<span class="saved-item ${t===active?'active':''}" onclick="selectToken('${t.replace(/'/g,"\\'")}')">
        ${t.substring(0,20)}... <span class="remove" onclick="event.stopPropagation();removeToken('${t.replace(/'/g,"\\'")}')">×</span>
      </span>`
    ).join('');
  }

  // ── URL/Token management ──
  window.saveBaseUrl = function() {
    const val = $('#dlg-base-url').value.trim();
    if (!val) return;
    const urls = getStorage(STORAGE_KEYS.BASE_URLS, []);
    if (!urls.includes(val)) urls.push(val);
    setStorage(STORAGE_KEYS.BASE_URLS, urls);
    setStorage(STORAGE_KEYS.ACTIVE_BASE_URL, val);
    $('#saved-urls').innerHTML = renderSavedUrls(urls, val);
    updateDialogUrl();
  };

  window.selectBaseUrl = function(url) {
    $('#dlg-base-url').value = url;
    setStorage(STORAGE_KEYS.ACTIVE_BASE_URL, url);
    const urls = getStorage(STORAGE_KEYS.BASE_URLS, []);
    $('#saved-urls').innerHTML = renderSavedUrls(urls, url);
    updateDialogUrl();
  };

  window.removeBaseUrl = function(url) {
    let urls = getStorage(STORAGE_KEYS.BASE_URLS, []);
    urls = urls.filter(u => u !== url);
    setStorage(STORAGE_KEYS.BASE_URLS, urls);
    const active = getStorage(STORAGE_KEYS.ACTIVE_BASE_URL, '');
    if (active === url) setStorage(STORAGE_KEYS.ACTIVE_BASE_URL, urls[0] || '');
    $('#saved-urls').innerHTML = renderSavedUrls(urls, urls[0] || '');
    if ($('#dlg-base-url').value === url) $('#dlg-base-url').value = urls[0] || '';
    updateDialogUrl();
  };

  window.saveToken = function() {
    const val = $('#dlg-token').value.trim();
    if (!val) return;
    const tokens = getStorage(STORAGE_KEYS.TOKENS, []);
    if (!tokens.includes(val)) tokens.push(val);
    setStorage(STORAGE_KEYS.TOKENS, tokens);
    setStorage(STORAGE_KEYS.ACTIVE_TOKEN, val);
    $('#saved-tokens').innerHTML = renderSavedTokens(tokens, val);
  };

  window.selectToken = function(token) {
    $('#dlg-token').value = token;
    setStorage(STORAGE_KEYS.ACTIVE_TOKEN, token);
    const tokens = getStorage(STORAGE_KEYS.TOKENS, []);
    $('#saved-tokens').innerHTML = renderSavedTokens(tokens, token);
  };

  window.removeToken = function(token) {
    let tokens = getStorage(STORAGE_KEYS.TOKENS, []);
    tokens = tokens.filter(t => t !== token);
    setStorage(STORAGE_KEYS.TOKENS, tokens);
    const active = getStorage(STORAGE_KEYS.ACTIVE_TOKEN, '');
    if (active === token) setStorage(STORAGE_KEYS.ACTIVE_TOKEN, tokens[0] || '');
    $('#saved-tokens').innerHTML = renderSavedTokens(tokens, tokens[0] || '');
    if ($('#dlg-token').value === token) $('#dlg-token').value = tokens[0] || '';
  };

  // ── Param Helpers ──
  window.selectPathParam = function(name, val) {
    const input = document.querySelector(`.path-param[data-name="${name}"]`);
    if (input) { input.value = val; updateDialogUrl(); }
  };

  window.selectQueryParam = function(name, val) {
    const input = document.querySelector(`.query-param[data-name="${name}"]`);
    const check = document.querySelector(`.query-check[data-name="${name}"]`);
    if (input) { input.value = val; }
    if (check) { check.checked = true; }
    updateDialogUrl();
  };

  window.applyPreset = function(idx) {
    if (!window._currentPresets || !window._currentQueryParams) return;
    const preset = window._currentPresets[idx];
    // Uncheck all first
    $$('.query-check').forEach(c => { c.checked = false; });
    // Reset to defaults
    window._currentQueryParams.forEach(p => {
      const input = document.querySelector(`.query-param[data-name="${p.name}"]`);
      if (input) input.value = p.defaultValue;
    });
    // Apply preset params
    for (const [key, val] of Object.entries(preset.params)) {
      const input = document.querySelector(`.query-param[data-name="${key}"]`);
      const check = document.querySelector(`.query-check[data-name="${key}"]`);
      if (input) input.value = val;
      if (check) check.checked = true;
    }
    updateDialogUrl();
  };

  window.updateDialogUrl = function() {
    const dialog = $('#dialog');
    let path = dialog.dataset.epPath;
    const baseUrl = ($('#dlg-base-url') || {}).value || '';

    // Replace path params
    $$('.path-param').forEach(input => {
      path = path.replace(`{${input.dataset.name}}`, input.value || `{${input.dataset.name}}`);
    });

    // Append query params
    const queryParts = [];
    $$('.query-check').forEach(check => {
      if (check.checked) {
        const name = check.dataset.name;
        const input = document.querySelector(`.query-param[data-name="${name}"]`);
        if (input && input.value) queryParts.push(`${name}=${encodeURIComponent(input.value)}`);
      }
    });

    let fullUrl = baseUrl + path;
    if (queryParts.length) fullUrl += '?' + queryParts.join('&');

    const urlDisplay = $('#dlg-full-url');
    if (urlDisplay) urlDisplay.textContent = fullUrl;
  };

  // ── SEND REQUEST ──
  window.sendRequest = async function(epId) {
    const dialog = $('#dialog');
    const method = dialog.dataset.epMethod;
    const btn = $('#btn-send');
    const urlDisplay = $('#dlg-full-url');
    const url = urlDisplay.textContent;
    const token = ($('#dlg-token') || {}).value || '';

    btn.disabled = true;
    btn.classList.add('loading');
    btn.textContent = '⏳ Sending...';

    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };

    // Body
    const bodyEl = $('#dlg-body');
    if (bodyEl && method !== 'GET' && method !== 'DELETE') {
      headers['Content-Type'] = 'application/json';
      options.body = bodyEl.value;
    }

    const startTime = performance.now();
    try {
      const resp = await fetch(url, options);
      const elapsed = Math.round(performance.now() - startTime);
      let data;
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await resp.json();
      } else {
        data = await resp.text();
      }

      const result = { status: resp.status, time: elapsed, data };
      $('#response-section').innerHTML = renderResponse(result);

      // Save response permanently
      const responses = getStorage(STORAGE_KEYS.RESPONSES, {});
      responses[epId] = result;
      setStorage(STORAGE_KEYS.RESPONSES, responses);

      // Save active baseUrl and token
      const baseUrlVal = ($('#dlg-base-url') || {}).value;
      if (baseUrlVal) setStorage(STORAGE_KEYS.ACTIVE_BASE_URL, baseUrlVal);
      if (token) setStorage(STORAGE_KEYS.ACTIVE_TOKEN, token);

    } catch (err) {
      let errorMsg = err.message;
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        errorMsg = 'Failed to fetch — Possible causes:\n1. Server is not running at the specified Base URL\n2. CORS is not enabled on the server (run: php artisan config:clear)\n3. Network/firewall issue';
      }
      $('#response-section').innerHTML = renderResponse({ status: 0, time: 0, data: { error: errorMsg } });
    }

    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = '▶ Send Request';
  };

  function renderResponse(result) {
    const statusClass = result.status >= 200 && result.status < 300 ? 's2xx' : result.status >= 400 && result.status < 500 ? 's4xx' : 's5xx';
    const jsonStr = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
    return `
      <div class="response-status">
        <span class="response-status-code ${statusClass}">${result.status || 'ERR'}</span>
        <span class="response-time">${result.time}ms</span>
      </div>
      <pre class="response-body">${syntaxHighlight(jsonStr)}</pre>`;
  }

  // ── Mobile Toggle ──
  window.toggleSidebar = function() {
    document.querySelector('.sidebar').classList.toggle('open');
  };

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    buildSidebar();
    buildContent();
    initSearch();
    initNavHighlight();
  });
})();
