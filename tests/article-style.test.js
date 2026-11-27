const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { Liquid } = require('liquidjs');
const liquid = new Liquid();
const template = fs.readFileSync('_includes/article-style.html', 'utf8');
const startup = fs.readFileSync('_includes/style-start.js', 'utf8');
const controls = fs.readFileSync('assets/js/theme.js', 'utf8');

test('cached pages reconcile changed preferences without discarding an automatic history style', () => {
  const win = new EventTarget(), doc = new EventTarget(), menu = new EventTarget();
  const root = {dataset:{recommended:'humanities',style:'tech',styleSource:'auto'}};
  let manual = null;
  const storage = {getItem:key=>key === 'blog-style' ? manual : null,
    setItem:(_,value)=>{manual=value;}, removeItem:()=>{manual=null;}};
  Object.assign(doc, {documentElement:root, getElementById:()=>menu, querySelector:()=>null, querySelectorAll:()=>[]});
  menu.querySelector = () => ({});
  win.matchMedia = () => new EventTarget();
  const ctx = {window:win, document:doc, localStorage:storage, Event};
  vm.runInNewContext(controls, ctx);
  const restore = () => win.dispatchEvent(Object.assign(new Event('pageshow'), {persisted:true}));
  restore();
  assert.equal(root.dataset.style, 'tech');
  menu.value = 'tech';
  menu.dispatchEvent(new Event('change'));
  assert.equal(root.dataset.styleSource, 'manual');
  manual = null;
  restore();
  assert.equal(root.dataset.style, 'humanities');
  assert.equal(root.dataset.styleSource, 'auto');
  manual = 'tech';
  win.dispatchEvent(Object.assign(new Event('storage'), {key:'blog-style'}));
  assert.equal(root.dataset.style, 'tech');
  assert.equal(menu.value, 'tech');
});

test('explicit style takes priority, then category, then tag, with technology fallback', async () => {
  const site = { data: { article_styles: { technology: ['编程','ai'], humanities: ['随笔','文学'] } } };
  for (const [fields, expected] of [
    [{theme:'technology',categories:['文学']}, 'tech'],
    [{theme:'humanities',categories:['编程']}, 'humanities'],
    [{theme:'auto',categories:['随笔'],tags:['AI']}, 'humanities'],
    [{tags:['文学']}, 'humanities'],
    [{categories:['随笔','编程']}, 'tech'],
    [{}, 'tech']
  ]) {
    assert.equal(await liquid.parseAndRender(template, {page:{layout:'post',...fields},site}), expected);
  }
});

test('first paint resolves manual, history, one-use navigation and external entry in order', () => {
  for (const [manual, saved, target, expected, source, referrer, blocked] of [
    ['tech','humanities','/article','tech'], [null,'humanities','/article','humanities'],
    [null,null,'/article','tech'], [null,null,'/different','humanities'],
    [null,null,null,'humanities'],
    [null,'tech',null,'humanities','manual'],
    [null,'tech',null,'tech','auto'],
    ['tech','humanities',null,'tech','auto'],
    [null,null,null,'tech',null,'https://example.org/source'],
    [null,null,null,'humanities',null,'https://external.org/source'],
    [null,null,null,'humanities',null,'',true]
  ]) {
    const document = {referrer,documentElement:{dataset:{recommended:'humanities'}}, addEventListener(){}};
    const session = new Map();
    session.set('blog-current-style', JSON.stringify({path:'/source',style:'tech'}));
    if (target) session.set('blog-next-style', JSON.stringify({target,style:'tech',time:Date.now()}));
    const history = {state:{blogStyle:saved, blogStyleSource:source, other:1},replaceState(state){this.state=state;}};
    vm.runInNewContext(startup, {document, window:{addEventListener(){}}, history, URL,
      localStorage:{getItem:()=>{if(blocked) throw Error('denied'); return manual;}}, location:{origin:'https://example.org',pathname:'/article',search:''},
      sessionStorage:{getItem:k=>{if(blocked) throw Error('denied'); return session.get(k) ?? null;}, setItem:(k,v)=>session.set(k,v), removeItem:k=>session.delete(k)}});
    assert.equal(document.documentElement.dataset.style, expected);
    assert.equal(history.state.other, 1);
    assert.equal(session.has('blog-next-style'), false);
  }
});
