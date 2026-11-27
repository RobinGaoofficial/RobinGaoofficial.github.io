const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { Liquid } = require('liquidjs');
const liquid = new Liquid();
const template = fs.readFileSync('_includes/article-style.html', 'utf8');
const startup = fs.readFileSync('_includes/style-start.js', 'utf8');

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
  for (const [manual, saved, target, expected] of [
    ['tech','humanities','/article','tech'], [null,'humanities','/article','humanities'],
    [null,null,'/article','tech'], [null,null,'/different','humanities'],
    [null,null,null,'humanities']
  ]) {
    const document = {documentElement:{dataset:{recommended:'humanities'}}, addEventListener(){}};
    const session = new Map();
    if (target) session.set('blog-next-style', JSON.stringify({target,style:'tech',time:Date.now()}));
    const history = {state:{blogStyle:saved, other:1},replaceState(state){this.state=state;}};
    vm.runInNewContext(startup, {document, window:{addEventListener(){}}, history, URL,
      localStorage:{getItem:()=>manual}, location:{pathname:'/article',search:''},
      sessionStorage:{getItem:k=>session.get(k) ?? null, setItem:(k,v)=>session.set(k,v), removeItem:k=>session.delete(k)}});
    assert.equal(document.documentElement.dataset.style, expected);
    assert.equal(history.state.other, 1);
    assert.equal(session.has('blog-next-style'), false);
  }
});
