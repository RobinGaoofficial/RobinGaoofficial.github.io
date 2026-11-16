// Compatibility patch for @waline/client 3.16.2 and @waline/core 0.1.0.
// OAuth providers may omit profile fields; the comment API expects strings.
const original = 'h.nick=s.value.display_name,h.mail=s.value.email,h.link=s.value.url';
const replacement = 'h.nick=s.value.display_name??``,h.mail=s.value.email??``,h.link=s.value.url??``';
const replyOriginal = 'h.pid=n.replyId,h.rid=n.rootId,h.at=n.replyUser';
const replyReplacement = 'h.pid=String(n.replyId),h.rid=String(n.rootId),h.at=n.replyUser??``';
const editOriginal = '(0,q.createElementVNode)(`button`,{type:`button`,class:`wl-edit`,onClick:a[0]||=t=>n(`edit`,e.comment)},[(0,q.createVNode)((0,q.unref)(ka))])';
const editReplacement = 'p.value?' + editOriginal + ':(0,q.createCommentVNode)(`owner-only edit`,!0)';
function patchWaline(source) {
  for (const [from, to] of [[original, replacement], [replyOriginal, replyReplacement], [editOriginal, editReplacement]]) {
    if (source.split(from).length !== 2) throw new Error('Waline code changed; review the compatibility patch.');
    source = source.replace(from, to);
  }
  return source;
}
module.exports = { patchWaline, replacement, replyReplacement, editReplacement };
