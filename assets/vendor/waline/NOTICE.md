# Waline client

`waline.js` and `waline.css` are the browser distribution of `@waline/client` 3.16.2.
Source: https://github.com/walinejs/waline
License: MIT (see LICENSE).

Run `pnpm install --frozen-lockfile` and `npm run vendor:waline` to reproduce these assets.
Source maps are omitted. The compiled distribution retains bundled dependency notices.

Local compatibility patch: missing OAuth nickname, email and website values are
normalized to empty strings before comment submission. This prevents null profile
fields from failing @waline/core 0.1.0 validation. `tools/patch-waline.cjs` applies
the change reproducibly and rejects unreviewed upstream code changes.
