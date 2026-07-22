/* ============================================================
   MetLife Brasil — Analytics Timeline Component
   ------------------------------------------------------------
   Variante do performance-timeline.js para o hub /landing-page.
   Suporta múltiplas campanhas (Copa · Seguro Vida) com paletas
   invertidas por classe modificadora (is-campanha-{id}).

   Uso:
   1. Inclua /assets/performance-timeline.css no <head>
   2. Inclua /assets/analytics-timeline.js antes de </body>
   3. Defina no <body>: data-week-id="week-N" (qual semana é a atual)
   ============================================================ */
(function () {
  'use strict';

  const MANIFEST_URL = '/landing-page/manifesto.json';

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

  function pillFor(entry, currentWeekId, kind /* 'published' | 'upcoming' */) {
    const isCurrent = kind === 'published' && entry.id === currentWeekId;
    const campanha = entry.campanha || 'copa';
    const campanhaCls = ' is-campanha-' + campanha;

    if (kind === 'upcoming') {
      return el('span', {
        class: 'pt-pill is-upcoming' + campanhaCls,
        title: 'Estimado: ' + (entry.data_estimada || 'a definir'),
        'aria-disabled': 'true'
      },
        el('span', { class: 'pt-pill-label' }, entry.label),
        el('span', { class: 'pt-pill-period' }, entry.periodo)
      );
    }

    const href = entry.arquivo || ('/landing-page/' + entry.id);
    return el('a', {
      class: 'pt-pill is-published' + (isCurrent ? ' is-current' : '') + campanhaCls,
      href: href,
      title: entry.label + ' · ' + entry.periodo,
      'aria-current': isCurrent ? 'page' : false
    },
      el('span', { class: 'pt-pill-label' }, entry.label),
      el('span', { class: 'pt-pill-period' }, entry.periodo)
    );
  }

  function renderTimeline(manifest, currentWeekId) {
    const wrap = el('nav', {
      class: 'performance-timeline',
      'aria-label': 'Reports semanais de Analytics',
      role: 'navigation'
    });
    const inner = el('div', { class: 'performance-timeline-inner' });

    inner.appendChild(el('span', {
      class: 'performance-timeline-label'
    }, 'Reports:'));

    // Agrupa por campanha, mantendo ordem
    const semanas = (manifest.semanas || []).slice().sort((a, b) => a.ordem - b.ordem);
    const futuras = (manifest.futuras || []).slice().sort((a, b) => a.ordem - b.ordem);
    const campanhasMap = (manifest.campanhas || {});

    // Agrupamento: ordem de aparição da campanha
    const groups = [];
    const groupMap = new Map();
    for (const s of semanas) {
      const c = s.campanha || 'copa';
      if (!groupMap.has(c)) {
        const grp = { campanha: c, meta: campanhasMap[c] || null, published: [], upcoming: [] };
        groupMap.set(c, grp);
        groups.push(grp);
      }
      groupMap.get(c).published.push(s);
    }
    for (const f of futuras) {
      const c = f.campanha || 'copa';
      if (!groupMap.has(c)) {
        const grp = { campanha: c, meta: campanhasMap[c] || null, published: [], upcoming: [] };
        groupMap.set(c, grp);
        groups.push(grp);
      }
      groupMap.get(c).upcoming.push(f);
    }

    const multiCampanha = groups.length > 1;

    groups.forEach((grp) => {
      // Cada campanha vira uma "linha" (via CSS grid-column: 2)
      const groupEl = el('div', {
        class: 'pt-group is-campanha-' + grp.campanha
      });
      if (multiCampanha && grp.meta) {
        groupEl.appendChild(el('span', {
          class: 'pt-group-label is-campanha-' + grp.campanha,
          title: grp.meta.descricao || ''
        }, grp.meta.label || grp.campanha));
      }
      for (const s of grp.published) groupEl.appendChild(pillFor(s, currentWeekId, 'published'));
      for (const f of grp.upcoming) groupEl.appendChild(pillFor(f, currentWeekId, 'upcoming'));
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
    const fromAttr = document.body && document.body.getAttribute('data-week-id');
    if (fromAttr) return fromAttr;

    const m = window.location.pathname.match(/\/landing-page\/(week-[^/]+)/);
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
      console.warn('[analytics-timeline] falhou ao carregar manifesto:', err);
      mount(renderError('Linha do tempo de reports indisponível no momento.'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
