# Results
- tests: PASS (13 passed, node --test)
- fix during build: initial test patterns used JS string literals with backslash escapes that collapsed (e.g. '\d' -> 'd'); rewrote tests to use [0-9]/[A-Za-z0-9_] classes and a runtime String.fromCharCode(92) so real \d handling is still covered
- app.js: PASS (node --check clean; DOM built via textContent, no innerHTML)
