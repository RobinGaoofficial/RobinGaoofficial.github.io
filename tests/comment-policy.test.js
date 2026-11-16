const test = require('node:test');
const assert = require('node:assert/strict');
const { preUpdate } = require('../services/waline/comment-policy.cjs');
const context = (user, owner) => ({ ctx: {state: {userInfo: user}}, getModel: () => ({select: async () => [{user_id: owner}]}) });
test('admins cannot rewrite another author while authors can edit their own text', async () => {
  const change = {objectId: '3', comment: 'edited'};
  assert.equal(await preUpdate.call(context({objectId: '1', type: 'administrator'}, 2), change), '只能修改自己发表的评论。');
  assert.equal(await preUpdate.call(context({objectId: '2', type: 'guest'}, 2), change), undefined);
  assert.equal(await preUpdate.call(context({objectId: '1', type: 'administrator'}, 1), change), undefined);
  assert.equal(await preUpdate.call(context({}, 2), change), '只能修改自己发表的评论。');
});
test('moderation and reactions remain governed by existing Waline permissions', async () => {
  for (const change of [{status:'spam'}, {sticky:true}, {like:1}]) {
    assert.equal(await preUpdate.call({}, {objectId:'3', ...change}), undefined);
  }
});
