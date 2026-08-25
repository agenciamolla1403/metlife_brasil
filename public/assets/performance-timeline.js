/* ============================================================
   MetLife Brasil — Performance Timeline Component
   ------------------------------------------------------------
   Componente reutilizável que renderiza uma timeline horizontal
   sticky com as semanas publicadas + futuras. Aparece logo
   abaixo do header global em qualquer página /performance/week-N.

   Uso:
   1. Inclua /assets/performance-timeline.css no <head>
   2. Inclua /assets/performance-timeline.js antes de </body>
   3. Defina no <body>: data-week-id="week-N" (qual semana é a atual)
   4. O componente faz o resto sozinho — fetch do manifesto.json e
      renderiza no topo do <body>, abaixo do header.
   ============================================================ */
(function () {
  'use strict';

  const MANIFEST_URL = '/performance/manifesto.json';

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

  function renderTimeline(manifest, currentWeekId) {
    const wrap = el('nav', {
      class: 'performance-timeline',
      'aria-label': 'Reports semanais',
      role: 'navigation'
    });
    const inner = el('div', { class: 'performance-timeline-inner' });

    // Label do componente
    inner.appendChild(el('span', {
      class: 'performance-timeline-label'
    }, 'Reports:'));

    // Agrupa por campanha (mesmo padrão do analytics-timeline)
    const semanas = (manifest.semanas || []).slice().sort((a, b) => a.ordem - b.ordem);
    const futuras = (manifest.futuras || []).slice().sort((a, b) => a.ordem - b.ordem);
    const campanhasMeta = manifest.campanhas || {};

    // Descobre a ordem das campanhas conforme aparecem nas semanas
    const seen = new Set();
    const campanhaOrder = [];
    for (const s of semanas.concat(futuras)) {
      const c = s.campanha || 'copa';
      if (!seen.has(c)) { seen.add(c); campanhaOrder.push(c); }
    }

    // Monta grupos {campanha, meta, published[], upcoming[]}
    const groups = campanhaOrder.map(c => ({
      campanha: c,
      meta: campanhasMeta[c] || null,
      published: semanas.filter(s => (s.campanha || 'copa') === c),
      upcoming: futuras.filter(f => (f.campanha || 'copa') === c)
    }));

    const multiCampanha = groups.length > 1;

    groups.forEach((grp) => {
      const groupEl = el('div', {
        class: 'pt-group is-campanha-' + grp.campanha
      });
      if (multiCampanha && grp.meta) {
        groupEl.appendChild(el('span', {
          class: 'pt-group-label is-campanha-' + grp.campanha,
          title: grp.meta.descricao || ''
        }, grp.meta.label || grp.campanha));
      }

      for (const s of grp.published) {
        const isCurrent = s.id === currentWeekId;
        const href = '/performance/' + s.id;
        const pill = el('a', {
          class: 'pt-pill is-published is-campanha-' + grp.campanha + (isCurrent ? ' is-current' : ''),
          href: href,
          title: s.label + ' · ' + s.periodo,
          'aria-current': isCurrent ? 'page' : false
        },
          el('span', { class: 'pt-pill-label' }, s.label),
          el('span', { class: 'pt-pill-period' }, s.periodo)
        );
        groupEl.appendChild(pill);
      }

      for (const f of grp.upcoming) {
        const pill = el('span', {
          class: 'pt-pill is-upcoming is-campanha-' + grp.campanha,
          title: 'Estimado: ' + (f.data_estimada || 'a definir'),
          'aria-disabled': 'true'
        },
          el('span', { class: 'pt-pill-label' }, f.label),
          el('span', { class: 'pt-pill-period' }, f.periodo)
        );
        groupEl.appendChild(pill);
      }

      inner.appendChild(groupEl);
    });

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
    // Tenta inserir logo após a page-subbar (breadcrumb).
    // Fallback: após o header. Último fallback: início do body.
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

  function getCurrentWeekId() {
    // 1. Via data-week-id no <body>
    const fromAttr = document.body && document.body.getAttribute('data-week-id');
    if (fromAttr) return fromAttr;

    // 2. Via URL: /performance/week-N
    const m = window.location.pathname.match(/\/performance\/(week-[^/]+)/);
    if (m) return m[1];

    return null;
  }

  async function init() {
    const currentWeekId = getCurrentWeekId();
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('Manifesto não encontrado (' + res.status + ')');
      const manifest = await res.json();
      const node = renderTimeline(manifest, currentWeekId);
      mount(node);
    } catch (err) {
      console.warn('[performance-timeline] falhou ao carregar manifesto:', err);
      mount(renderError('Linha do tempo de reports indisponível no momento.'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
