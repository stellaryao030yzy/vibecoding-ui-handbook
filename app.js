const DATA = window.VIBE_DATA;
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const readLocal = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "");
    return (
      Array.isArray(fallback)
        ? Array.isArray(value)
        : value !== null && typeof value === typeof fallback
    )
      ? value
      : fallback;
  } catch {
    return fallback;
  }
};
const state = {
  view: "dashboard",
  query: "",
  type: new Set(),
  style: new Set(),
  source: new Set(),
  tag: new Set(),
  refSkill: "all",
  sort: "source",
  favorites: new Set(readLocal("vibe-favorites-v2", [])),
  recent: readLocal("vibe-recent-v1", []),
  notes: readLocal("vibe-notes-v1", {}),
  used: readLocal("vibe-used-v1", {}),
};
const intentAliases = {
  数字滚动:
    "number ticker|sliding number|animated number|数字滚动计数器|滑动数字|动态数字",
  鼠标跟随:
    "smooth cursor|cursor|pointer|magnetic|spotlight|自定义光标|磁吸交互|聚光灯",
  文字出现:
    "text reveal|typing animation|typewriter|blur fade|box reveal|打字机|文字揭示|文字入场",
  卡片展开:
    "morphing dialog|morphing popover|dialog|popover|形态变换|展开|弹窗",
  无限滚动: "marquee|infinite slider|carousel|跑马灯|无限滑动|轮播",
  加载反馈: "loader|loading|progress|shimmer|skeleton|spinner|加载|进度|骨架屏",
  科技光效:
    "glow effect|border beam|animated beam|particles|meteors|spotlight|辉光|流光束|粒子",
};
const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const unique = (key) =>
  [
    ...new Set(
      DATA.components
        .flatMap((x) => {
          const v = x[key];
          if (v === undefined || v === null) return [];
          return Array.isArray(v) ? v : [v];
        })
        .filter((x) => x !== undefined && x !== null && x !== ""),
    ),
  ].sort((a, b) => a.localeCompare(b, "zh-CN"));
const findAny = (id) =>
  DATA.components.find((x) => x.id === id) ||
  DATA.skills.find((x) => `skill:${x.id}` === id) ||
  DATA.references.find((x) => `ref:${x.id}` === id);
const isSaved = (id) => state.favorites.has(id);

function markdown(md) {
  return escapeHTML(md)
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
}
function preview(c) {
  if (c.id)
    return `<div class="preview live-demo-preview"><span class="preview-note">真实互动</span><iframe src="demos/index.html?id=${encodeURIComponent(c.id)}" loading="lazy" sandbox="allow-scripts" title="${escapeHTML(c.title)}（${escapeHTML(c.cnTitle)}）互动演示"></iframe></div>`;
  if (c.previewImage)
    return `<div class="preview real-preview${c.previewMotion ? " has-motion" : ""}"${c.previewMotion ? ` tabindex="0" data-playback="idle" aria-label="${escapeHTML(c.title)}（${escapeHTML(c.cnTitle)}）动态参考图，悬停或聚焦播放"` : ""}><span class="preview-note">${c.previewMotion ? "悬停播放" : "静态参考"}</span><img src="${c.previewImage}" loading="lazy" alt="${escapeHTML(c.title)}（${escapeHTML(c.cnTitle)}）官方示例渲染图"${c.previewMotion ? ` data-static="${c.previewImage}" data-motion="${c.previewMotion}"` : ""}></div>`;
  return `<div class="preview preview-${c.preview} concept-preview" tabindex="0" aria-label="${escapeHTML(c.title)} 的概念动画预览，悬停或聚焦播放"><span class="preview-note">悬停播放</span><div class="pv pv-a"></div><div class="pv pv-b"></div><div class="pv-copy">${escapeHTML(c.title)}</div></div>`;
}
function favButton(id) {
  return `<button class="favorite ${isSaved(id) ? "is-saved" : ""}" data-favorite="${escapeHTML(id)}" aria-label="收藏">${isSaved(id) ? "♥" : "♡"}</button>`;
}
function componentCard(c) {
  const custom = (c.tags || [])
    .map((x) => `<span class="tag-chip-sm">${escapeHTML(x)}</span>`)
    .join("");
  return `<article class="effect-card">${favButton(c.id)}${preview(c)}<div class="card-body"><div class="card-meta"><span class="tag source">${c.source}</span><span class="tag">${escapeHTML(c.type)}</span></div><h3>${escapeHTML(c.title)} <span class="cn-name">${escapeHTML(c.cnTitle)}</span></h3><p>${escapeHTML(c.description)}</p><div class="style-row">${c.styles.map((x) => `<span>${escapeHTML(x)}</span>`).join("")}</div>${custom ? `<div class="personal-tag-row">${custom}</div>` : ""}<div class="card-footer"><span>${c.referenceIds.length} 篇相关参考</span><button data-open-component="${c.id}">查看详情 →</button></div></div></article>`;
}
function skillCard(s) {
  return `<article class="skill-card">${favButton(`skill:${s.id}`)}<div class="skill-num">${String(DATA.skills.indexOf(s) + 1).padStart(2, "0")}</div><p class="eyebrow">${s.referenceIds.length} REFERENCES</p><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.description)}</p><button data-open-skill="${s.id}">阅读完整技能 →</button></article>`;
}
function referenceRow(r) {
  return `<article class="reference-row">${favButton(`ref:${r.id}`)}<div><span class="tag source">${escapeHTML(r.skillId)}</span><h3>${escapeHTML(r.title)}</h3><p>${escapeHTML(r.summary)}</p><div class="xref">关联 ${r.componentIds.length} 个组件</div></div><button data-open-reference="${escapeHTML(r.id)}">阅读全文 →</button></article>`;
}
function searchTerms(query) {
  const q = query.toLowerCase();
  return [
    q,
    ...Object.entries(intentAliases)
      .filter(
        ([label, words]) =>
          label.includes(q) || q.includes(label) || words.includes(q),
      )
      .flatMap(([, words]) => words.split("|")),
  ].filter(Boolean);
}
function matches(text) {
  if (!state.query) return true;
  const hay = text.toLowerCase();
  return searchTerms(state.query).some((term) => hay.includes(term));
}

function filteredComponents() {
  let a = DATA.components.filter(
    (c) =>
      matches(
        [
          c.title,
          c.cnTitle,
          c.name,
          c.description,
          c.type,
          c.source,
          ...c.styles,
          ...(c.tags || []),
        ].join(" "),
      ) &&
      (!state.type.size || state.type.has(c.type)) &&
      (!state.style.size || c.styles.some((x) => state.style.has(x))) &&
      (!state.source.size || state.source.has(c.source)) &&
      (!state.tag.size || (c.tags || []).some((x) => state.tag.has(x))),
  );
  if (state.sort === "name") a.sort((x, y) => x.title.localeCompare(y.title));
  if (state.sort === "source")
    a.sort(
      (x, y) =>
        x.source.localeCompare(y.source) || x.title.localeCompare(y.title),
    );
  if (state.sort === "recent")
    a.sort((x, y) => state.recent.indexOf(x.id) - state.recent.indexOf(y.id));
  if (state.sort === "related")
    a.sort((x, y) => y.referenceIds.length - x.referenceIds.length);
  return a;
}
function renderComponents() {
  const a = filteredComponents();
  $("#componentCount").textContent = a.length;
  $("#componentGrid").innerHTML = a.map(componentCard).join("");
  $("#componentEmpty").hidden = !!a.length;
  const chips = [
    ...["type", "style", "source", "tag"].flatMap((k) =>
      [...state[k]].map((v) => ({ k, v })),
    ),
  ];
  $("#activeFilters").innerHTML = chips
    .map(
      (x) =>
        `<button class="filter-chip" data-remove="${x.k}" data-value="${x.v}">${x.v} ×</button>`,
    )
    .join("");
  bindDynamic();
}
function renderSkills() {
  const a = DATA.skills.filter((s) =>
    matches(`${s.title} ${s.description} ${s.content}`),
  );
  $("#skillGrid").innerHTML = a.map(skillCard).join("");
  $("#skillEmpty").hidden = !!a.length;
  bindDynamic();
}
function renderReferences() {
  const a = DATA.references.filter(
    (r) =>
      (state.refSkill === "all" || r.skillId === state.refSkill) &&
      matches(`${r.title} ${r.summary} ${r.content} ${r.skillId}`),
  );
  $("#referenceCount").textContent = a.length;
  $("#referenceList").innerHTML = a.map(referenceRow).join("");
  $("#referenceEmpty").hidden = !!a.length;
  bindDynamic();
}
function renderFavorites() {
  const ids = [...state.favorites],
    comps = ids.map(findAny).filter((x) => x?.source),
    skills = ids
      .filter((x) => x.startsWith("skill:"))
      .map(findAny)
      .filter(Boolean),
    refs = ids
      .filter((x) => x.startsWith("ref:"))
      .map(findAny)
      .filter(Boolean);
  $("#favoriteCount").textContent = ids.length;
  $("#favoritesContent").innerHTML = ids.length
    ? `${comps.length ? `<h3 class="saved-heading">组件 · ${comps.length}</h3><div class="card-grid">${comps.map(componentCard).join("")}</div>` : ""}${skills.length ? `<h3 class="saved-heading">技能 · ${skills.length}</h3><div class="skill-grid">${skills.map(skillCard).join("")}</div>` : ""}${refs.length ? `<h3 class="saved-heading">参考 · ${refs.length}</h3><div class="reference-list">${refs.map(referenceRow).join("")}</div>` : ""}`
    : '<div class="empty-state"><span>♡</span><h2>还没有收藏</h2><p>在组件、技能或参考条目上点击心形。</p><button data-go="components">浏览组件</button></div>';
  bindDynamic();
}
function compactItem(c) {
  return `<button class="compact-item" data-open-component="${c.id}">${c.previewImage ? `<img src="${c.previewImage}" loading="lazy" alt="">` : '<span class="compact-placeholder">UI</span>'}<span><b>${escapeHTML(c.title)}</b><small>${escapeHTML(c.cnTitle)} · ${escapeHTML(c.type)}</small></span></button>`;
}
function renderDashboard() {
  const recent = state.recent
    .map((id) => DATA.components.find((c) => c.id === id))
    .filter(Boolean)
    .slice(0, 4);
  const favorite = [...state.favorites]
    .map((id) => DATA.components.find((c) => c.id === id))
    .filter(Boolean)
    .slice(0, 6);
  $("#recentComponents").innerHTML = recent.length
    ? recent.map(compactItem).join("")
    : '<div class="dashboard-empty">打开一个组件后，它会出现在这里。</div>';
  $("#favoriteComponents").innerHTML = favorite.length
    ? favorite
        .map(
          (c) =>
            `<button data-open-component="${c.id}"><b>${escapeHTML(c.title)}</b><span>${escapeHTML(c.cnTitle)}</span></button>`,
        )
        .join("")
    : '<div class="dashboard-empty">还没有收藏组件。</div>';
  bindDynamic();
}
function render() {
  renderComponents();
  renderSkills();
  renderReferences();
  renderFavorites();
  renderDashboard();
}

function relationLinks(ids, kind) {
  const items = ids
    .map((id) =>
      kind === "ref"
        ? DATA.references.find((x) => x.id === id)
        : DATA.components.find((x) => x.id === id),
    )
    .filter(Boolean);
  return items.length
    ? `<div class="relation-list">${items.map((x) => `<button data-open-${kind === "ref" ? "reference" : "component"}="${escapeHTML(x.id)}">${escapeHTML(x.title)}</button>`).join("")}</div>`
    : '<p class="muted">暂无自动匹配项</p>';
}
function openComponent(id) {
  const c = DATA.components.find((x) => x.id === id);
  state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, 20);
  localStorage.setItem("vibe-recent-v1", JSON.stringify(state.recent));
  const skillLinks = c.skillIds
    .map((id) => {
      const s = DATA.skills.find((x) => x.id === id);
      return s
        ? `<button data-open-skill="${id}">${escapeHTML(s.title)}</button>`
        : "";
    })
    .join("");
  const prompt = `请在当前项目中实现「${c.title}（${c.cnTitle}）」交互。参考 ${c.source} 的 ${c.name} 组件思路。交互类型：${c.type}；风格：${c.styles.join("、")}。请先说明触发方式、默认/悬停/聚焦/激活/禁用/加载状态，再实现进入与退出动画。优先使用 transform 与 opacity；支持键盘、focus-visible、触摸设备和 prefers-reduced-motion；避免布局抖动，并说明移动端与低性能设备的降级方案。完成后逐项验证交互、可访问性与性能。`;
  const used = state.used[id] || [];
  showDialog(
    `${preview(c)}<div class="dialog-body"><div class="card-meta"><span class="tag source">${c.source}</span><span class="tag">${c.license}</span><span class="tag">${c.type}</span></div><h2>${escapeHTML(c.title)} <span class="cn-name detail-cn">${escapeHTML(c.cnTitle)}</span></h2><p class="dialog-summary">${escapeHTML(c.description)}</p><div class="decision-callout"><b>使用判断</b><p>适合需要「${escapeHTML(c.type)}」且偏向 ${c.styles.map(escapeHTML).join("、")} 的界面。先验证它是否改善状态表达；如果只是装饰、降低可读性或拖慢任务流程，就不要使用。</p></div><div class="detail-grid"><section><h3>风格特征</h3><div class="relation-list">${c.styles.map((x) => `<span>${x}</span>`).join("")}</div></section><section><h3>依赖</h3><p>${c.dependencies.length ? c.dependencies.map(escapeHTML).join(" · ") : "无额外依赖信息"}</p></section><section><h3>对应设计技能</h3><div class="relation-list">${skillLinks}</div></section><section><h3>源码文件</h3><p class="mono">${c.files.map(escapeHTML).join("<br>")}</p></section></div><section class="prompt-box"><h3>直接开工包</h3><code>${escapeHTML(prompt)}</code><button data-copy="${encodeURIComponent(prompt)}">复制完整提示词</button></section><section class="personal-note"><div><h3>我的笔记</h3><span>自动保存在本机</span></div><textarea data-note="${c.id}" placeholder="记录适合场景、参数、踩坑或修改后的方案…">${escapeHTML(state.notes[c.id] || "")}</textarea><div class="usage-row"><input id="usageProject" placeholder="项目名称" aria-label="项目名称"><button data-used="${c.id}">标记已使用</button></div>${used.length ? `<p class="usage-history">用过：${used.map(escapeHTML).join(" · ")}</p>` : ""}</section><section class="related"><h3>对应参考文档</h3>${relationLinks(c.referenceIds, "ref")}</section><div class="dialog-actions"><a href="${c.docsUrl}" target="_blank">官方文档 ↗</a><a href="${c.sourceUrl}" target="_blank">GitHub 源码 ↗</a></div></div>`,
  );
  renderDashboard();
}
function openSkill(id) {
  const s = DATA.skills.find((x) => x.id === id),
    related = DATA.components
      .filter((c) => c.skillIds.includes(id))
      .slice(0, 12);
  showDialog(
    `<div class="document-head"><p class="eyebrow">BETTER-WEB-UI SKILL</p><h2>${escapeHTML(s.title)}</h2><p>${escapeHTML(s.description)}</p></div><div class="dialog-body"><div class="detail-grid"><section><h3>参考文档</h3><p>${s.referenceIds.length} 篇</p></section><section><h3>本地源文件</h3><p class="mono">${s.path}</p></section></div><section class="related"><h3>所属参考</h3>${relationLinks(s.referenceIds, "ref")}</section><section class="related"><h3>相关组件</h3>${relationLinks(
      related.map((x) => x.id),
      "component",
    )}</section><article class="markdown-body"><p>${markdown(s.content)}</p></article><div class="dialog-actions"><a href="${s.sourceUrl}" target="_blank">GitHub 来源 ↗</a></div></div>`,
  );
}
function openReference(id) {
  const r = DATA.references.find((x) => x.id === id);
  showDialog(
    `<div class="document-head"><p class="eyebrow">${escapeHTML(r.skillId)} / REFERENCE</p><h2>${escapeHTML(r.title)}</h2><p>${escapeHTML(r.summary)}</p></div><div class="dialog-body"><section class="related"><h3>相关组件</h3>${relationLinks(r.componentIds, "component")}</section><article class="markdown-body"><p>${markdown(r.content)}</p></article><div class="dialog-actions"><a href="${r.sourceUrl}" target="_blank">GitHub 原文 ↗</a><button data-open-skill="${r.skillId}">查看所属技能</button></div></div>`,
  );
}
function showDialog(html) {
  $("#dialogContent").innerHTML = html;
  $("#detailDialog").showModal();
  bindDynamic();
}
function bindMotionPreviews() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  $$(".preview").forEach((box) => {
    if (box.dataset.motionBound) return;
    box.dataset.motionBound = "true";
    const img = box.querySelector("img[data-motion]"),
      note = box.querySelector(".preview-note");
    if (reduced) {
      if (note && (img || box.classList.contains("concept-preview")))
        note.textContent = "已减少动态";
      return;
    }
    const play = () => {
      box.dataset.playback = "playing";
      if (img) {
        img.src = img.dataset.motion;
        note.textContent = "正在播放";
      } else if (note) note.textContent = "正在播放";
    };
    const stop = () => {
      box.dataset.playback = "idle";
      if (img) {
        img.src = img.dataset.static;
        note.textContent = "悬停播放";
      } else if (note) note.textContent = "悬停播放";
    };
    if (img || box.classList.contains("concept-preview")) {
      box.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "touch") play();
      });
      box.addEventListener("pointerleave", (e) => {
        if (e.pointerType !== "touch") stop();
      });
      box.addEventListener("focusin", play);
      box.addEventListener("focusout", stop);
      box.addEventListener("pointerup", (e) => {
        if (e.pointerType !== "mouse")
          (box.dataset.playback === "playing" ? stop : play)();
      });
    }
  });
}
function bindDynamic() {
  $$("[data-favorite]").forEach(
    (b) =>
      (b.onclick = (e) => {
        e.stopPropagation();
        const id = b.dataset.favorite;
        state.favorites.has(id)
          ? state.favorites.delete(id)
          : state.favorites.add(id);
        localStorage.setItem(
          "vibe-favorites-v2",
          JSON.stringify([...state.favorites]),
        );
        render();
      }),
  );
  $$("[data-open-component]").forEach(
    (b) => (b.onclick = () => openComponent(b.dataset.openComponent)),
  );
  $$("[data-open-skill]").forEach(
    (b) => (b.onclick = () => openSkill(b.dataset.openSkill)),
  );
  $$("[data-open-reference]").forEach(
    (b) => (b.onclick = () => openReference(b.dataset.openReference)),
  );
  $$("[data-copy]").forEach(
    (b) =>
      (b.onclick = () =>
        navigator.clipboard
          .writeText(decodeURIComponent(b.dataset.copy))
          .then(() => toast("已复制提示词"))),
  );
  $$("[data-go]").forEach((b) => (b.onclick = () => switchView(b.dataset.go)));
  $$("[data-note]").forEach(
    (n) =>
      (n.oninput = () => {
        state.notes[n.dataset.note] = n.value;
        localStorage.setItem("vibe-notes-v1", JSON.stringify(state.notes));
      }),
  );
  $$("[data-used]").forEach(
    (b) =>
      (b.onclick = () => {
        const value = $("#usageProject").value.trim();
        if (!value) return toast("请先填写项目名称");
        state.used[b.dataset.used] = [
          ...new Set([value, ...(state.used[b.dataset.used] || [])]),
        ].slice(0, 8);
        localStorage.setItem("vibe-used-v1", JSON.stringify(state.used));
        toast("已记录到项目");
        openComponent(b.dataset.used);
      }),
  );
  bindMotionPreviews();
}
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 1500);
}
// 标签筛选的数据源是标签库（用户可增删改的名册），不是从组件 tags 反推。
// 否则新建但尚未被任何组件使用的标签永远不会出现在列表里。
function filters(key, root, stateKey = key) {
  const groupId = key === "styles" ? "style" : key === "tags" ? "tag" : key;
  const group =
    typeof Tags !== "undefined" && Tags.groups?.find((x) => x.id === groupId);
  if (group) {
    const counts =
      typeof tagUsageCount === "function" ? tagUsageCount(groupId) : {};
    $(root).innerHTML = group.items
      .map(
        (v) =>
          `<label class="filter-option"><input type="checkbox" data-filter="${stateKey}" value="${escapeHTML(v)}"><span>${escapeHTML(v)}</span><small>${counts[v] || 0}</small></label>`,
      )
      .join("");
    return;
  }
  $(root).innerHTML = unique(key)
    .map(
      (v) =>
        `<label class="filter-option"><input type="checkbox" data-filter="${stateKey}" value="${v}"><span>${v}</span><small>${DATA.components.filter((c) => (Array.isArray(c[key]) ? c[key] : [c[key]]).includes(v)).length}</small></label>`,
    )
    .join("");
}
function clearFilters() {
  state.query = "";
  state.type.clear();
  state.style.clear();
  state.source.clear();
  state.tag.clear();
  $("#searchInput").value = "";
  $$("[data-filter]").forEach((x) => (x.checked = false));
  render();
}
function switchView(view) {
  state.view = view;
  $$(".view").forEach((v) => v.classList.remove("is-active"));
  $$(".nav-link").forEach((n) =>
    n.classList.toggle("is-active", n.dataset.view === view),
  );
  $(`#${view}View`).classList.add("is-active");
  const labels = {
    dashboard: "个人工作台",
    components: "全部组件",
    skills: "设计技能",
    references: "参考文档",
    favorites: "收藏内容",
  };
  $("#scopeNote").textContent = labels[view];
  render();
  window.scrollTo({
    top: document.querySelector(".control-deck").offsetTop - 68,
    behavior: "smooth",
  });
}

filters("type", "#typeFilters");
filters("styles", "#styleFilters", "style");
filters("source", "#sourceFilters");
filters("tags", "#tagFilters", "tag");
$("#referenceSkillFilters").innerHTML =
  `<button class="is-active" data-ref-skill="all">全部 <b>${DATA.references.length}</b></button>` +
  DATA.skills
    .filter((s) => s.referenceIds.length)
    .map(
      (s) =>
        `<button data-ref-skill="${s.id}">${s.title}<b>${s.referenceIds.length}</b></button>`,
    )
    .join("");
$("#searchInput").oninput = (e) => {
  state.query = e.target.value.trim();
  if (state.query && state.view === "dashboard") switchView("components");
  else render();
};
$$("[data-intent]").forEach(
  (b) =>
    (b.onclick = () => {
      $("#searchInput").value = b.dataset.intent;
      state.query = b.dataset.intent;
      switchView("components");
    }),
);
$$("[data-filter]").forEach(
  (c) =>
    (c.onchange = (e) => {
      const set = state[e.target.dataset.filter];
      e.target.checked ? set.add(e.target.value) : set.delete(e.target.value);
      render();
    }),
);
document.addEventListener("click", (e) => {
  const x = e.target.closest("[data-remove]");
  if (x) {
    state[x.dataset.remove].delete(x.dataset.value);
    const i = $(
      `[data-filter="${x.dataset.remove}"][value="${CSS.escape(x.dataset.value)}"]`,
    );
    if (i) i.checked = false;
    render();
  }
  const rs = e.target.closest("[data-ref-skill]");
  if (rs) {
    state.refSkill = rs.dataset.refSkill;
    $$("[data-ref-skill]").forEach((b) =>
      b.classList.toggle("is-active", b === rs),
    );
    renderReferences();
  }
});
$$(".nav-link").forEach((b) => (b.onclick = () => switchView(b.dataset.view)));
$$("[data-go]").forEach((b) => (b.onclick = () => switchView(b.dataset.go)));
$("#resetFilters").onclick = clearFilters;
$("#emptyReset").onclick = clearFilters;
$("#sortSelect").onchange = (e) => {
  state.sort = e.target.value;
  renderComponents();
};
$("#closeDialog").onclick = () => $("#detailDialog").close();
$("#detailDialog").onclick = (e) => {
  if (e.target === $("#detailDialog")) $("#detailDialog").close();
};
$("#themeToggle").onclick = () => {
  const t =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  localStorage.setItem("vibe-theme", t);
};
document.documentElement.dataset.theme =
  localStorage.getItem("vibe-theme") || "light";
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
  ) {
    e.preventDefault();
    $("#searchInput").focus();
  }
  if (e.key === "Escape" && $("#detailDialog").open) $("#detailDialog").close();
});
$("#exportData").onclick = () => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites: [...state.favorites],
    recent: state.recent,
    notes: state.notes,
    used: state.used,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `vibe-index-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("备份已导出");
};
$("#importData").onchange = async (e) => {
  try {
    const data = JSON.parse(await e.target.files[0].text());
    state.favorites = new Set(data.favorites || []);
    state.recent = data.recent || [];
    state.notes = data.notes || {};
    state.used = data.used || {};
    localStorage.setItem(
      "vibe-favorites-v2",
      JSON.stringify([...state.favorites]),
    );
    localStorage.setItem("vibe-recent-v1", JSON.stringify(state.recent));
    localStorage.setItem("vibe-notes-v1", JSON.stringify(state.notes));
    localStorage.setItem("vibe-used-v1", JSON.stringify(state.used));
    render();
    toast("备份已导入");
  } catch {
    toast("备份文件无效");
  } finally {
    e.target.value = "";
  }
};

// 真实 DOM 预览层：所有组件先获得可操作状态，专属适配器会逐类替换通用行为。
