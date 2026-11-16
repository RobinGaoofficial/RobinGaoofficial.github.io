// Compatibility patch for @waline/client 3.16.2 and @waline/core 0.1.0.
// OAuth providers may omit profile fields; the comment API expects strings.
const original = 'h.nick=s.value.display_name,h.mail=s.value.email,h.link=s.value.url';
const replacement = 'h.nick=s.value.display_name??``,h.mail=s.value.email??``,h.link=s.value.url??``';
function patchWaline(source) {
  if (source.split(original).length !== 2) throw new Error('Waline profile assignment changed; review the compatibility patch.');
  return source.replace(original, replacement);
}
module.exports = { patchWaline, replacement };
