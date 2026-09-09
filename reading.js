let contentPromise;
markdown=md=>DOMPurify.sanitize(marked.parse(String(md||'').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'')),{USE_PROFILES:{html:true},FORBID_TAGS:['img','iframe','video','audio']});
const sourceBeforeReading=openSource;
openSource=id=>{sourceBeforeReading(id);$$('.source-text').forEach(pre=>{const rendered=document.createElement('article');rendered.className='markdown-body';rendered.innerHTML=markdown(pre.textContent);pre.replaceWith(rendered)})};
// The playbook already carries its own bodies; loading the (empty) content stub would wipe them.
function ensureContent(){if(window.VIBE_CONTENT_READY)return Promise.resolve();if(!contentPromise)contentPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='data/content.js';script.onload=()=>{for(const kind of ['skills','references'])for(const item of DATA[kind])item.content=window.VIBE_CONTENT[kind][item.id]||'';resolve()};script.onerror=()=>{contentPromise=undefined;script.remove();reject(Error('正文加载失败'))};document.head.append(script)});return contentPromise}
const switchBeforeReading=switchView;
switchView=view=>{switchBeforeReading(view);if(['skills','references'].includes(view)){const expected=view;$('#scopeNote').textContent='正在载入离线全文…';ensureContent().then(()=>{if(state.view===expected){render();$('#scopeNote').textContent='离线全文已就绪，可搜索正文'}}).catch(()=>toast('正文加载失败，请刷新重试'))}};
const skillBeforeReading=openSkill,referenceBeforeReading=openReference;
openSkill=async id=>{try{await ensureContent();skillBeforeReading(id)}catch{toast('技能正文加载失败，请重试')}};
openReference=async id=>{try{await ensureContent();referenceBeforeReading(id)}catch{toast('参考正文加载失败，请重试')}};
// Namespace supplemental documents so they can be searched without inflating the original counts.
const supplementSearch=document.createElement('section');supplementSearch.className='dashboard-panel';supplementSearch.innerHTML='<h2>检索补充资料</h2><label class="field-label">关键词<input id="supplementSearch" type="search" placeholder="例如：dialog、键盘、focus、audit"></label><div id="supplementResults" class="compact-list"></div>';$('.dashboard-grid').append(supplementSearch);
$('#supplementSearch').oninput=e=>{const query=e.target.value.trim().toLowerCase();const found=(window.VIBE_SUPPLEMENTS||[]).filter(s=>!query||[s.title,s.description,...s.documents.map(d=>d.content)].join(' ').toLowerCase().includes(query));$('#supplementResults').innerHTML=found.map(s=>`<button data-source="${s.id}">${escapeHTML(s.title)} · ${s.documents.length} 篇</button>`).join('')||'<p>暂无匹配资料</p>'};
const families=[
  {test:/number|ticker/,name:'数字变化',use:'适合金额、统计值、计数变化；保持数字占位宽度稳定。',avoid:'读屏不应逐帧播报数字；高频数据更新时使用简化过渡。'},
  {test:/dialog|popover|panel/,name:'浮层与内容切换',use:'适合从摘要进入详情或展示临时操作；保持触发元素与内容之间的空间关系。',avoid:'关闭后必须返回触发位置；避免退出动画期间误触后方内容。'},
  {test:/cursor|pointer|magnetic|spotlight/,name:'指针反馈',use:'适合桌面端局部悬停反馈；以原始点击区域为准。',avoid:'触摸端没有悬停；不能依赖自定义光标传达必需信息。'},
  {test:/marquee|infinite-slider|carousel/,name:'连续内容展示',use:'适合客户 Logo、作品和非关键内容；提供暂停与手动浏览。',avoid:'正文与必须阅读的信息不应持续移动；避免重复项被读屏多次读取。'},
  {test:/text|word|typing/,name:'文字呈现',use:'适合标题或短文案；保留可选择、可读取的完整文本。',avoid:'避免大段正文逐字播放；优先保证首屏内容及时出现。'},
  {test:/glow|beam|particle|meteor|grid|ripple/,name:'装饰与氛围',use:'适合局部品牌氛围或重点区域；让背景与前景保持对比。',avoid:'多种循环效果叠加会抢注意力；在低性能设备与减少动态模式中静态降级。'}
];
const familyFor=c=>families.find(f=>f.test.test(c.name));
const componentBeforeReading=openComponent;
openComponent=id=>{componentBeforeReading(id);const c=DATA.components.find(x=>x.id===id),family=familyFor(c);if(family){$('.decision-callout').innerHTML=`<b>${family.name} · 使用建议</b><p>${family.use}</p><p>${family.avoid}</p>`;const candidates=DATA.components.filter(x=>x.id!==id&&familyFor(x)===family).slice(0,4);const target=[...$('#dialogContent').querySelectorAll('section.related')].find(s=>s.querySelector('h3')?.textContent.startsWith('相似组件'));if(target){target.innerHTML=`<h3>同类交互 · ${family.name}</h3><div class="relation-list">${candidates.map(x=>`<button data-open-component="${x.id}">${escapeHTML(x.title)} · ${escapeHTML(x.cnTitle)}</button><button data-compare="${x.id}">＋ 对比</button>`).join('')}</div><p class="panel-copy">按主要交互目的匹配；具体行为以源码与演示为准。</p><button data-compare="${c.id}">＋ 当前组件</button>`}}const curated=document.createElement('section');curated.className='related';curated.innerHTML='<h3>优先阅读 · 动效通用原则</h3><p class="panel-copy">这两篇直接解释减少动态效果与常规 UI 时长，适合作为实现前的基础约束。</p>'+relationLinks(['animate/respect-reduced-motion','animate/ui-under-300ms'],'ref');$('.dialog-body').append(curated);bindDynamic();renderCompareBar()};
// Reset scrolling when navigating between documents inside the same dialog.
const showBeforeReading=showDialog;
showDialog=html=>{showBeforeReading(html);$('#detailDialog').scrollTop=0};
