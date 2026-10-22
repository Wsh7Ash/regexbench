// Browser wiring for regexbench. Pure logic lives in regex.js; this file only
// connects it to the DOM.
import { compile, explain, matchAll, segment } from './regex.js';

const $ = (id) => document.getElementById(id);

const patternEl = $('pattern');
const flagsEl = $('flags');
const inputEl = $('input');
const errorEl = $('error');
const highlightEl = $('highlight');
const countEl = $('count');
const groupsEl = $('groups');
const explainEl = $('explain');

function render() {
  const pattern = patternEl.value;
  const flags = flagsEl.value;
  const input = inputEl.value;

  const compiled = compile(pattern, flags);
  if (!compiled.ok) {
    errorEl.textContent = 'Invalid pattern: ' + compiled.error;
    errorEl.hidden = false;
    highlightEl.textContent = input;
    countEl.textContent = '0 matches';
    groupsEl.textContent = '';
    explainEl.textContent = '';
    return;
  }
  errorEl.hidden = true;

  const matches = matchAll(compiled.regex, input);
  countEl.textContent = matches.length + (matches.length === 1 ? ' match' : ' matches');

  // Build highlighted output using DOM nodes (no innerHTML) so user text and
  // patterns can never inject markup.
  highlightEl.textContent = '';
  for (const seg of segment(input, matches)) {
    if (seg.match) {
      const mark = document.createElement('mark');
      mark.className = 'hit';
      mark.textContent = seg.text;
      highlightEl.appendChild(mark);
    } else {
      highlightEl.appendChild(document.createTextNode(seg.text));
    }
  }

  // Capture-group table for the first few matches.
  groupsEl.textContent = '';
  if (matches.length) {
    const table = document.createElement('table');
    const head = document.createElement('tr');
    for (const th of ['#', 'match', 'index']) {
      const cell = document.createElement('th');
      cell.textContent = th;
      head.appendChild(cell);
    }
    const maxGroups = Math.max(...matches.map(m => m.groups.length));
    for (let g = 1; g <= maxGroups; g++) {
      const cell = document.createElement('th');
      cell.textContent = 'group ' + g;
      head.appendChild(cell);
    }
    table.appendChild(head);

    matches.slice(0, 50).forEach((m, i) => {
      const row = document.createElement('tr');
      const values = [String(i + 1), m.text, String(m.index), ...m.groups];
      for (const v of values) {
        const cell = document.createElement('td');
        cell.textContent = v == null ? '' : v;
        row.appendChild(cell);
      }
      table.appendChild(row);
    });
    groupsEl.appendChild(table);
  }

  // Plain-language explanation.
  explainEl.textContent = '';
  const steps = explain(pattern);
  if (steps.length) {
    const ol = document.createElement('ol');
    for (const step of steps) {
      const li = document.createElement('li');
      li.textContent = step;
      ol.appendChild(li);
    }
    explainEl.appendChild(ol);
  }
}

for (const el of [patternEl, flagsEl, inputEl]) {
  el.addEventListener('input', render);
}

// A couple of starter examples so the page is immediately interactive.
if (!patternEl.value) patternEl.value = '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}';
if (!flagsEl.value) flagsEl.value = 'g';
if (!inputEl.value) {
  inputEl.value = 'Contact bob@example.com or sue@test.org for info.\nInvalid: not-an-email';
}
render();
