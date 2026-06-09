/* ============================================================
   MetLife Brasil — Elemidia Timeline Component
   ------------------------------------------------------------
   Variante do analytics-timeline.js para o hub /elemidia.
   Mesmo padrão visual (reusa /assets/performance-timeline.css).

   Uso:
   1. Inclua /assets/performance-timeline.css no <head>
   2. Inclua /assets/elemidia-timeline.js antes de </body>
   3. Defina no <body>: data-proposta-id="ft-N" (qual proposta é a atual)
   ============================================================ */
(function () {
  'use strict';

  const MANIFEST_URL = '/elemidia/manifesto.json';

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  function renderTimeline(manifest, currentPropostaId) {
    const wrap = el('nav', {
      class: 'performance-timeline',
      'aria-label': 'Propostas Elemidia',
      role: 'navigation'
    });
    const inner = el('div', { class: 'performance-timeline-inner' });

    inner.appendChild(el('span', {
      class: 'performance-timeline-label'
    }, 'Propostas:'));

    const propostas = (manifest.propostas || []).slice().sort((a, b) => a.ordem - b.ordem);
    for (const p of propostas) {
      const isCurrent = p.id === currentPropostaId;
      const href = '/elemidia/' + p.id;
      const pill = el('a', {
        class: 'pt-pill is-published' + (isCurrent ? ' is-current' : ''),
        href: href,
        title: p.label + ' · ' + p.periodo,
        'aria-current': isCurrent ? 'page' : false
      },
        el('span', { class: 'pt-pill-label' }, p.label),
        el('span', { class: 'pt-pill-period' }, p.periodo)
      );
      inner.appendChild(pill);
    }

    const futuras = (manifest.futuras || []).slice().sort((a, b) => a.ordem - b.ordem);
    for (const f of futuras) {
      const pill = el('span', {
        class: 'pt-pill is-upcoming',
        title: 'Estimado: ' + (f.data_estimada || 'a definir'),
        'aria-disabled': 'true'
      },
        el('span', { class: 'pt-pill-label' }, f.label),
        el('span', { class: 'pt-pill-period' }, f.periodo)
      );
      inner.appendChild(pill);
    }

    wrap.appendChild(inner);
    return wrap;
  }

  function renderError(msg) {
    const wrap = el('nav', { class: 'performance-timeline performance-timeline-error' });
    const inner = el('div', { class: 'performance-timeline-inner' });
    inner.appendChild(el('span', {
      class: 'performance-timeline-label'
    }, msg));
    wrap.appendChild(inner);
    return wrap;
  }

  function findInsertionPoint() {
    const subbar = document.querySelector('.page-subbar');
    if (subbar && subbar.parentNode) return { parent: subbar.parentNode, before: subbar.nextSibling };

    const header = document.querySelector('header.mlh-header, header[role="banner"], header.site-header');
    if (header && header.parentNode) return { parent: header.parentNode, before: header.nextSibling };

    return { parent: document.body, before: document.body.firstChild };
  }

  function mount(timelineEl) {
    const { parent, before } = findInsertionPoint();
    parent.insertBefore(timelineEl, before);
  }

  function getCurrentPropostaId() {
    const fromAttr = document.body && document.body.getAttribute('data-proposta-id');
    if (fromAttr) return fromAttr;

    const m = window.location.pathname.match(/\/elemidia\/(ft-[^/]+)/);
    if (m) return m[1];

    return null;
  }

  async function init() {
    const currentId = getCurrentPropostaId();
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('Manifesto não encontrado (' + res.status + ')');
      const manifest = await res.json();
      const node = renderTimeline(manifest, currentId);
      mount(node);
    } catch (err) {
      console.warn('[elemidia-timeline] falhou ao carregar manifesto:', err);
      mount(renderError('Linha do tempo de propostas indisponível no momento.'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
