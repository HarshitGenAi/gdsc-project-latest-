/* ui.js
   Common UI utilities: toasts, simple modal wrappers, chips, read-time calc, safe HTML helper.
   Exposes: DevBlog.ui
*/
(function () {
  const ns = window.DevBlog = window.DevBlog || {};

  // Toast system
  function showToast(message, opts = 2800) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'form toast fade-in';
    t.style.margin = '8px';
    t.textContent = message;
    // determine options
    let timeout = 2800;
    let variant = '';
    if (typeof opts === 'number') {
      timeout = opts;
    } else if (opts && typeof opts === 'object') {
      timeout = opts.timeout || timeout;
      variant = opts.variant || '';
    }
    // heuristic: mark as error if not explicitly set but message looks like error
    const looksError = /fail|error|invalid|not match|required/i.test(String(message));
    if ((variant === 'error') || (!variant && looksError)) t.classList.add('toast-error');
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(()=>t.remove(), 300);
    }, timeout);
  }

  // Success overlay (auto hides)
  function showSuccessOverlay(duration = 900) {
    const existing = document.querySelector('.success-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    const frame = document.createElement('div'); frame.className = 'success-frame';
    const circle = document.createElement('div'); circle.className = 'success-check';
    circle.innerHTML = `\n      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <polyline points="20 6 9 17 4 12"></polyline>\n      </svg>\n    `;
    overlay.appendChild(frame);
    overlay.appendChild(circle);
    document.body.appendChild(overlay);
    setTimeout(()=>{
      overlay.style.opacity = '0';
      setTimeout(()=> overlay.remove(), 260);
    }, duration);
  }

  // Confirm wrapper (native is fine)
  function confirmAction(message) {
    return window.confirm(message);
  }

  // Safe HTML setter (minimal)
  function setSafeHtml(el, html) {
    // For demo, we allow limited HTML (from our editor). To be safe, avoid script tags.
    if (!el) return;
    const cleaned = String(html).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    el.innerHTML = cleaned;
  }

  // Read time estimate ~200 wpm
  function estimateReadTime(htmlContent) {
    const text = stripHtml(htmlContent || '');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return minutes;
  }

  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Create an element helper for tags/chips
  function createTagChip(label, data = {}) {
    const btn = document.createElement('button');
    btn.className = 'tag';
    btn.type = 'button';
    btn.textContent = label;
    Object.keys(data).forEach(k => btn.dataset[k] = data[k]);
    return btn;
  }

  // Download helper (copy to clipboard)
  function copyToClipboard(text) {
    try {
      navigator.clipboard.writeText(text);
      showToast('Link copied to clipboard');
    } catch (e) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Link copied to clipboard (fallback)');
    }
  }

  ns.ui = {
    showToast,
    confirmAction,
    setSafeHtml,
    estimateReadTime,
    stripHtml,
    createTagChip,
    copyToClipboard,
    showSuccessOverlay
  };
})();
