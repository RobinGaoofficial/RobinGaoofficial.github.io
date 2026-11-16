// Moderation remains available, but only the original author may rewrite text.
async function preUpdate(comment) {
  if (!Object.hasOwn(comment, 'comment')) return;
  const user = this.ctx.state.userInfo;
  const [original] = await this.getModel('Comment').select({ objectId: comment.objectId });
  if (!user?.objectId || !original?.user_id || String(original.user_id) !== String(user.objectId)) {
    return '只能修改自己发表的评论。';
  }
}
module.exports = { preUpdate };
