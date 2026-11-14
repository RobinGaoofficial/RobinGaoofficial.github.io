# Reader Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reader-facing metadata filtering, sorting, and accessible client-side pagination to the existing Jekyll blog index.

**Architecture:** Jekyll continues to render every post card, including searchable text and normalized metadata in `data-*` attributes. A small dependency-free browser module reads filter controls, determines the matching cards, sorts that result set, and renders one page at a time. HTML remains readable without JavaScript.

**Tech Stack:** Jekyll/Liquid, vanilla JavaScript, Node's built-in test runner, PowerShell.

**Spec:** User request in this chat, 2026-11-14.

## Global Constraints

- Preserve all existing uncommitted content, Obsidian settings, articles, and image assets.
- Do not run Git reset/clean or overwrite personal content.
- Use UTF-8 explicitly for PowerShell JSON reads if a JSON-reading script is needed.
- Run `npm test` after JavaScript modifications.
- Add no production dependencies.

## Review Focus

- Empty result sets show an accessible empty state and hide page navigation.
- Clearing all filters restores page one of newest posts.
- Date range endpoints are inclusive and ignore incomplete/invalid ranges safely.
- Categories and months originate from rendered cards, avoiding stale hand-maintained options.
- Pagination applies after filtering and sorting, not before.

### Task 1: Extract pure reader-list behavior

**Files:**
- Create: `assets/js/post-browser.js`
- Create: `tests/post-browser.test.js`
- Create: `package.json`

- [ ] Write failing tests for combined filtering, stable sorting, inclusive date ranges, and page slicing.
- [ ] Run `npm test` and confirm the new tests fail because the module is absent.
- [ ] Implement `filterAndSortPosts(posts, filters)` and `paginatePosts(posts, page, pageSize)` with no DOM access.
- [ ] Run `npm test` and confirm all tests pass.

### Task 2: Render the reader controls on the existing index

**Files:**
- Modify: `index.html`
- Modify: `assets/js/search.js`
- Modify: `assets/css/style.css`

- [ ] Add semantic controls for keyword, category, month, inclusive date range, and sort order.
- [ ] Emit safe card metadata for generated and legacy articles.
- [ ] Use the pure module to update card visibility, result status, empty state, and labelled pagination controls.
- [ ] Extend responsive styles for controls and pagination without changing article layout.
- [ ] Run `npm test` and inspect the rendered Jekyll site where available.

### Task 3: Validate source and deployment

**Files:**
- Modify: `tools/publish.ps1` only if an existing JSON-read path is found.

- [ ] Verify no PowerShell JSON reader remains without `-Encoding UTF8`; do not add unrelated JSON handling.
- [ ] Run `npm test`, Jekyll build if available, and inspect Git diff/status.
- [ ] Commit only feature files, preserving unrelated local work; push to existing `main` after validation.
- [ ] Verify GitHub Pages and `gaobinbin.dev` serve the deployed search controls.
