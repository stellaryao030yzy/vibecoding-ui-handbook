/*
 * Keeps the UI honest about optional local content.
 * When the playbook is absent the counts read 0 and the empty states explain why,
 * instead of pretending nothing matched.
 */
(() => {
  const hint = (el, title, body) => {
    if (!el) return;
    el.innerHTML = `<span>∅</span><h2>${title}</h2><p class="panel-copy">${body}</p>`;
  };

  $$('.nav-link').forEach(n => {
    const b = n.querySelector('b');
    if (!b || b.id) return;
    if (n.dataset.view === 'skills') b.textContent = DATA.skills.length;
    if (n.dataset.view === 'references') b.textContent = DATA.references.length;
  });
  const hero = $$('.hero-ledger b');
  if (hero[1]) hero[1].textContent = DATA.skills.length;
  if (hero[2]) hero[2].textContent = DATA.references.length;

  if (!DATA.skills.length) {
    hint($('#skillEmpty'), '设计手册未加载', `${PLAYBOOK_HINT}<br>组件索引不受影响，可照常浏览与检索。`);
  }
  if (!DATA.references.length) {
    hint($('#referenceEmpty'), '参考文档未加载', `${PLAYBOOK_HINT}<br>组件详情页的提示词与使用建议不依赖这部分内容。`);
  }
  if (!(window.VIBE_SUPPLEMENTS || []).length) {
    $$('.dashboard-panel').forEach(p => {
      if (p.querySelector('.eyebrow')?.textContent.trim() === 'SUPPLEMENTAL SOURCES') {
        const list = p.querySelector('.compact-list');
        if (list) list.innerHTML = '<p class="panel-copy">补充资料为本地可选内容，运行 node tools/sync-supplements.mjs 后刷新可加载。</p>';
      }
    });
  }
})();

// Signals to cloud.js that app state exists, so it can re-render instead of reloading.
window.__vibeAppReady = true;
