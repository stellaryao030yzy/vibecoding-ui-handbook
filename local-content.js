/*
 * Bootstrap + optional local-only content.
 *
 * The public repository ships only the MIT component index. Two heavier, licence
 * sensitive payloads live in data/local/ and are gitignored:
 *   - playbook.js    better-web-ui skills and references (source-available, not MIT)
 *   - supplements.js third-party document snapshots (Animate UI is MIT + Commons Clause)
 *
 * Both are loaded before the app boots so the UI never renders half-empty panels,
 * and their absence must never break the page.
 */
const LOCAL_BOOT = ['interactive-previews.js', 'app.js', 'personal.js', 'vendor/marked.js', 'vendor/purify.js', 'tags.js', 'local-upload.js', 'reading.js', 'playbook-ui.js', 'share.js'];
const LOCAL_OPTIONAL = ['data/local/playbook.js', 'data/local/supplements.js'];
const PLAYBOOK_HINT = '设计手册正文不随公开仓库分发。本地执行 node tools/sync-playbook.mjs 后刷新即可恢复技能与参考。';

function loadScript(src) {
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { s.remove(); resolve(true); };
    s.onerror = () => { s.remove(); resolve(false); };
    document.head.append(s);
  });
}

// Runs before app.js, so touch window.VIBE_DATA rather than app.js's DATA binding.
function applyPlaybook() {
  const p = window.VIBE_PLAYBOOK;
  if (!p || !Array.isArray(p.skills) || !p.skills.length) return false;
  const d = window.VIBE_DATA;
  d.skills = p.skills;
  d.references = Array.isArray(p.references) ? p.references : [];
  window.VIBE_CONTENT = {skills: {}, references: {}};
  for (const kind of ['skills', 'references'])
    for (const item of d[kind]) window.VIBE_CONTENT[kind][item.id] = item.content || '';
  window.VIBE_CONTENT_READY = true;
  return true;
}

(async () => {
  await Promise.all(LOCAL_OPTIONAL.map(loadScript));
  applyPlaybook();
  for (const src of LOCAL_BOOT) await loadScript(src);
})();
