/*
 * 本地个人组件库。
 *
 * 数据流：
 *   - 预览图：FileReader 转 dataURL，必要时用 canvas 压缩到宽度 800px JPEG 0.85。
 *   - 持久化：localStorage 'vibe-my-components-v1'。导出备份走既有 JSON 路径。
 *   - 标签：site/tags.js 提供标签库，标签必须从库中选取，没有时自动新建。
 *
 * 不需要云端、不需要登录，所有写入都在当前浏览器。
 */
const PERSONAL_KEY = 'vibe-my-components-v1';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 800;
const JPG_QUALITY = 0.85;

const readJSON = (value, fallback) => { try { const v = JSON.parse(value); return v ?? fallback } catch { return fallback } };
const slugify = s => String(s || '').toLowerCase().trim()
  .replace(/[\s_]+/g, '-')
  .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

function newPersonalId() {
  return `personal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ------------------------------------------------------------ 个人库抽象

const PersonalComponents = {
  list: [],

  load() {
    const raw = readJSON(localStorage.getItem(PERSONAL_KEY), []);
    this.list = Array.isArray(raw) ? raw : [];
    return this.list;
  },

  save() {
    const clean = this.list.map(({personal, ...rest}) => rest);
    try {
      localStorage.setItem(PERSONAL_KEY, JSON.stringify(clean));
    } catch (e) {
      toast('保存失败：浏览器本地存储空间已满，请导出后清理再试。');
      throw e;
    }
  },

  byId(id) {
    return this.list.find(c => c.id === id) || null;
  },

  add(record) {
    const id = record.id || newPersonalId();
    const slug = record.slug || (slugify(record.name) || slugify(record.title) || `item-${this.list.length + 1}`);
    const entry = {
      ...record,
      id,
      slug,
      createdAt: record.createdAt || new Date().toISOString()
    };
    this.list.push(entry);
    this.save();
    this.injectIntoData();
    return entry;
  },

  update(id, changes) {
    const i = this.list.findIndex(c => c.id === id);
    if (i < 0) return null;
    this.list[i] = {...this.list[i], ...changes, updatedAt: new Date().toISOString()};
    this.save();
    this.injectIntoData();
    return this.list[i];
  },

  remove(id) {
    this.list = this.list.filter(c => c.id !== id);
    this.save();
    this.injectIntoData();
  },

  // 把 list 注入 VIBE_DATA.components，附带 personal 标记以供渲染层识别
  injectIntoData() {
    if (!window.VIBE_DATA) return;
    window.VIBE_DATA.components = (window.VIBE_DATA.components || []).filter(c => !c.personal);
    const personal = this.list.map(c => ({
      ...c,
      personal: true,
      source: '个人库',
      previewImage: c.previewImage || null,
      previewMotion: null,
      docsUrl: c.docsUrl || '#',
      sourceUrl: c.sourceUrl || '#',
      referenceIds: [],
      skillIds: [],
      dependencies: c.dependencies || [],
      styles: c.styles || [],
      files: c.files || [],
      preview: 'card'
    }));
    window.VIBE_DATA.components = (window.VIBE_DATA.components || []).concat(personal);
  }
};
window.PersonalComponents = PersonalComponents;
PersonalComponents.load();
PersonalComponents.injectIntoData();

// ------------------------------------------------------------ 图片处理

function readFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error('读取失败'));
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片解析失败'));
    img.src = src;
  });
}

async function fileToImageDataUrl(file) {
  if (!file) return null;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('仅支持 PNG / JPG / WebP');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('预览图超过 2 MB，请压缩后再试。');
  }
  const dataUrl = await readFileDataUrl(file);
  const img = await loadImage(dataUrl);
  if (img.naturalWidth <= MAX_IMAGE_WIDTH) return dataUrl;
  const ratio = MAX_IMAGE_WIDTH / img.naturalWidth;
  const canvas = document.createElement('canvas');
  canvas.width = MAX_IMAGE_WIDTH;
  canvas.height = Math.round(img.naturalHeight * ratio);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPG_QUALITY);
}

// ------------------------------------------------------------ 投稿表单

const EDIT_LICENSES = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'MPL-2.0', '其他 / 待确认'];

function getKnownTypes() {
  const seen = new Set();
  for (const c of (window.VIBE_DATA?.components || [])) {
    if (c.type) seen.add(c.type);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function uploadFormHtml(existing) {
  const e = existing || {};
  const tags = Tags ? Tags.library : [];
  const selected = e.tags || [];
  const typeOptions = getKnownTypes();
  return `<form id="uploadForm">
    <label class="field-label">组件名称（英文）<input name="title" required maxlength="80" placeholder="Marquee" value="${escapeHTML(e.title || '')}"></label>
    <label class="field-label">中文名<input name="cnTitle" maxlength="80" placeholder="无缝跑马灯" value="${escapeHTML(e.cnTitle || '')}"></label>
    <label class="field-label">组件标识<input name="name" required maxlength="60" placeholder="marquee" pattern="[A-Za-z0-9-]+" title="仅限字母、数字与连字符" value="${escapeHTML(e.name || '')}"${existing ? ' readonly' : ''}></label>
    <label class="field-label">一句话描述<textarea name="description" required maxlength="300" placeholder="适合展示客户 Logo 的无缝横向滚动。">${escapeHTML(e.description || '')}</textarea></label>
    <label class="field-label">交互类型<select name="type"><option value="">（不分类）</option>${typeOptions.map(t => `<option${t === e.type ? ' selected' : ''}>${escapeHTML(t)}</option>`).join('')}</select></label>
    <fieldset class="field-label"><legend>标签</legend>${Tags.renderTagsInput(selected)}
      <p class="panel-copy">输入新标签回车即加入库；从下方已有标签点选也直接添加。</p>
    </fieldset>
    <label class="field-label">依赖（逗号分隔）<input name="dependencies" maxlength="200" placeholder="motion, tailwindcss" value="${escapeHTML((e.dependencies || []).join(', '))}"></label>
    <label class="field-label">许可证<select name="license">${EDIT_LICENSES.map(l => `<option${l === e.license ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="field-label">文档或演示链接<input name="docsUrl" type="url" maxlength="300" placeholder="https://" value="${escapeHTML(e.docsUrl && e.docsUrl !== '#' ? e.docsUrl : '')}"></label>
    <label class="field-label">源码链接<input name="sourceUrl" type="url" maxlength="300" placeholder="https://github.com/..." value="${escapeHTML(e.sourceUrl && e.sourceUrl !== '#' ? e.sourceUrl : '')}"></label>
    <label class="field-label">Vibe 提示词（可选）<textarea name="prompt" maxlength="2000" placeholder="把你在用的开工提示词贴上来，自己方便复用。">${escapeHTML(e.prompt || '')}</textarea></label>
    <label class="field-label">预览图（PNG / JPG / WebP，≤ 2 MB；超过会自动缩到宽度 800px 压缩）<input name="preview" type="file" accept="image/png,image/jpeg,image/webp"></label>
    ${existing?.previewImage ? `<p class="panel-copy">已上传一张预览图；选新文件会替换。</p>` : ''}
    <p class="panel-copy" id="uploadStatus"></p>
    <button class="primary-action" type="submit">${existing ? '保存修改' : '保存到本地'}</button>
    <button type="button" id="uploadCancel">取消</button>
  </form>`;
}

function openUploadDialog(existing) {
  // 标签输入是表单的一部分，缺了就渲染不出来。显式提示，避免点了没反应
  if (!Tags || typeof Tags.renderTagsInput !== 'function') {
    toast('标签模块尚未就绪，请刷新页面重试');
    return;
  }
  document.getElementById('detailDialog')?.close();
  showDialog(`<div class="dialog-body"><h2>${existing ? '编辑本地组件' : '上传个人组件'}</h2>
    <p class="panel-copy">${existing ? '修改你的个人组件。数据只保存在当前浏览器。' : '仅保存在当前浏览器。可随时编辑或删除。'}</p>
    ${uploadFormHtml(existing)}</div>`);

  document.getElementById('uploadCancel').onclick = () => document.getElementById('detailDialog').close();
  document.getElementById('uploadForm').onsubmit = e => submitUpload(e, existing);
  bindTagInput(document.getElementById('uploadForm'));
}

function bindTagInput(form) {
  if (!form) return;
  const chips = form.querySelector('.tag-chips');
  const input = form.querySelector('#tagInput');
  if (!chips || !input) return;

  function addChip(v) {
    v = String(v || '').trim().slice(0, 24);
    if (!v) return;
    if ([...chips.querySelectorAll('.tag-chip')].some(c => c.dataset.value === v)) {
      input.value = '';
      return;
    }
    addTag(v);
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.dataset.value = v;
    chip.innerHTML = `${escapeHTML(v)}<button type="button" data-untag="${escapeHTML(v)}" aria-label="移除">×</button>`;
    chips.appendChild(chip);
    chip.querySelector('[data-untag]').onclick = () => chip.remove();
    input.value = '';
  }

  input.onkeydown = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const values = input.value.split(',').map(x => x.trim()).filter(Boolean);
      values.forEach(addChip);
    }
  };

  form.querySelectorAll('[data-tag-add]').forEach(btn => {
    btn.onclick = () => addChip(btn.dataset.tagAdd);
  });

  chips.querySelectorAll('[data-untag]').forEach(b => {
    b.onclick = () => b.closest('.tag-chip')?.remove();
  });
}

function getSelectedTags(form) {
  return [...form.querySelectorAll('.tag-chip')].map(c => c.dataset.value).filter(Boolean);
}

async function submitUpload(e, existing) {
  e.preventDefault();
  const f = e.target;
  const status = document.getElementById('uploadStatus');

  let previewImage = existing?.previewImage || null;
  const file = f.elements.preview.files[0];
  if (file) {
    status.textContent = '正在处理图片…';
    try {
      previewImage = await fileToImageDataUrl(file);
    } catch (err) {
      status.textContent = `图片处理失败：${err.message}`;
      return;
    }
  }

  const tags = getSelectedTags(f);
  for (const t of tags) addTag(t);

  const record = {
    title: f.elements.title.value.trim(),
    cnTitle: f.elements.cnTitle.value.trim() || f.elements.title.value.trim(),
    name: f.elements.name.value.trim(),
    description: f.elements.description.value.trim(),
    type: f.elements.type.value || null,
    license: f.elements.license.value,
    dependencies: f.elements.dependencies.value.split(',').map(s => s.trim()).filter(Boolean),
    // 标签只走 tags 字段，不复制进 styles：否则会同时污染官方「风格特征」筛选，
    // 并在卡片上把同一批标签显示两遍（style-row 与 personal-tag-row）
    styles: [],
    tags,
    previewImage,
    docsUrl: f.elements.docsUrl.value.trim() || null,
    sourceUrl: f.elements.sourceUrl.value.trim() || null,
    prompt: f.elements.prompt.value.trim() || null
  };

  if (existing) {
    PersonalComponents.update(existing.id, record);
    document.getElementById('detailDialog').close();
    toast('已保存');
  } else {
    PersonalComponents.add(record);
    document.getElementById('detailDialog').close();
    toast('已加入个人库');
  }
  Tags.reload();
  render();
}

// ------------------------------------------------------------ 接入既有界面

const uploadOrigCard = componentCard;
componentCard = c => {
  const html = uploadOrigCard(c);
  if (!c.personal) return html;
  const id = c.id;
  return html
    .replace(`<span>${c.referenceIds.length} 篇相关参考</span>`,
             `<span class="personal-local-flag">本地</span><span>${c.referenceIds.length} 篇相关参考</span>`)
    .replace(`<button data-open-component="${id}">查看详情 →</button>`,
             `<button data-open-component="${id}">查看详情 →</button>` +
             `<button data-personal-edit="${id}">编辑</button>` +
             `<button data-personal-del="${id}">删除</button>`);
};

const uploadOrigOpen = openComponent;
openComponent = id => {
  uploadOrigOpen(id);
  const c = window.VIBE_DATA.components.find(x => x.id === id);
  if (!c?.personal) return;
  const section = document.createElement('section');
  section.className = 'related';
  section.innerHTML = `<h3>本地组件</h3>
    <p class="panel-copy">仅保存在当前浏览器。可随时编辑或删除；数据随备份 JSON 一起导出。</p>
    <div class="relation-list">
      <button data-personal-edit="${id}">编辑此组件</button>
      <button data-personal-del="${id}">删除此组件</button>
    </div>`;
  document.querySelector('#dialogContent .dialog-body')?.append(section);
};

const uploadOrigBind = bindDynamic;
bindDynamic = () => {
  uploadOrigBind();
  $$('[data-personal-edit]').forEach(b => {
    b.onclick = () => {
      const c = window.VIBE_DATA.components.find(x => x.id === b.dataset.personalEdit) || PersonalComponents.byId(b.dataset.personalEdit);
      if (c) {
        openUploadDialog(c);
      }
    };
  });
  $$('[data-personal-del]').forEach(b => {
    b.onclick = () => {
      const c = window.VIBE_DATA.components.find(x => x.id === b.dataset.personalDel) || PersonalComponents.byId(b.dataset.personalDel);
      if (!c) return;
      if (!confirm(`删除《${c.title}》？本地不可恢复。`)) return;
      PersonalComponents.remove(c.id);
      document.getElementById('detailDialog').close();
      render();
      toast('已删除');
    };
  });
};

// ------------------------------------------------------------ 顶栏按钮

function mountTopbarButtons() {
  const bar = document.querySelector('.topbar');
  if (!bar) return;
  // 把所有顶栏右侧元素包进一个 flex 容器，避免被 grid 拆到不同 cell 后
  // 被 1fr 列拉宽（之前按钮被拉成整列宽就是这个原因）
  let actions = bar.querySelector('.topbar-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'topbar-actions';
    const themeToggle = bar.querySelector('#themeToggle');
    if (themeToggle) {
      bar.insertBefore(actions, themeToggle);
      actions.append(themeToggle);
    } else {
      bar.append(actions);
    }
  }
  if (!actions.querySelector('.upload-button')) {
    const btn = document.createElement('button');
    btn.className = 'upload-button';
    btn.textContent = '上传组件';
    btn.onclick = () => openUploadDialog();
    actions.insertBefore(btn, actions.firstChild);
  }
  if (!actions.querySelector('.tags-button')) {
    const btn = document.createElement('button');
    btn.className = 'tags-button';
    btn.textContent = '管理标签';
    btn.onclick = () => openTagsManager();
    actions.insertBefore(btn, actions.firstChild);
  }
}

mountTopbarButtons();
