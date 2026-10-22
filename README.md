# regexbench

A local, in-browser regex workbench. Type a pattern and some sample text and
see live match highlighting, a capture-group table, and a plain-language
explanation of what the pattern does — all offline, with zero dependencies and
no build step. Nothing ever leaves your browser.

## Features

- **Live match highlighting** as you type (pattern, flags, or text).
- **Capture-group table** — group text and match index for up to 50 matches.
- **Plain-language explanation** of common constructs (`\d`, `\w`, `\s`, `^`,
  `$`, `.`, character classes, groups, `|`, quantifiers…).
- **Inline error reporting** for invalid patterns instead of a thrown exception.
- Safe by construction: output is built with DOM `textContent`/nodes, never
  `innerHTML`, so sample text and patterns can't inject markup.
- Handles zero-length matches (e.g. `x*`) without hanging.

## Run it

Open `index.html` in any modern browser — double-click works, or serve the
folder:

```
python3 -m http.server
# then visit http://localhost:8000/
```

## Test it

The core logic (`src/regex.js`) is pure and DOM-free, so it runs under Node's
built-in test runner:

```
npm test
# or: node --test "tests/**/*.test.mjs"
```

## Layout

- `src/regex.js` — pure matching/segmenting/explanation logic (tested)
- `src/app.js` — DOM wiring only
- `index.html`, `styles.css` — the page

## License

MIT
