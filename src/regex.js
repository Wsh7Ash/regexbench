// Core regex logic for regexbench. Pure functions over strings — no DOM — so
// the same code runs in the browser and under Node's test runner.

// Compile a pattern with flags, returning a structured result instead of
// throwing, so the UI can show errors inline.
export function compile(pattern, flags = '') {
  if (typeof flags !== 'string' || /[^dgimsuvy]/.test(flags)) {
    return { ok: false, error: `invalid flags: ${flags}`, regex: null };
  }
  try {
    return { ok: true, error: null, regex: new RegExp(pattern, flags) };
  } catch (err) {
    return { ok: false, error: err.message, regex: null };
  }
}

// Extract every match (with index, matched text, and capture groups) from the
// input. Handles both global and non-global patterns; guards against zero-length
// matches causing an infinite loop.
export function matchAll(regex, input) {
  const flags = regex.flags.includes('g') ? regex.flags : regex.flags + 'g';
  const re = new RegExp(regex.source, flags);
  const out = [];
  let m;
  let lastIndex = 0;
  while ((m = re.exec(input)) !== null) {
    out.push({
      index: m.index,
      text: m[0],
      groups: m.slice(1),
      named: m.groups ? { ...m.groups } : {},
    });
    if (m[0].length === 0) {
      re.lastIndex += 1; // avoid infinite loop on empty matches
    }
    lastIndex = re.lastIndex;
    if (lastIndex > input.length) break;
  }
  return out;
}

// Split the input into segments that are either matched or not, so a renderer
// can lay out highlighting without re-running the regex. Returns a list of
// { text, match } where match is the match object (or null).
export function segment(input, matches) {
  const segments = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.index > cursor) {
      segments.push({ text: input.slice(cursor, m.index), match: null });
    }
    if (m.text.length === 0) {
      segments.push({ text: '', match: m });
    } else {
      segments.push({ text: input.slice(m.index, m.index + m.text.length), match: m });
    }
    cursor = m.index + m.text.length;
  }
  if (cursor < input.length) {
    segments.push({ text: input.slice(cursor), match: null });
  }
  return segments;
}

// A small library of common regex constructs, used to produce a plain-language
// explanation of a pattern. Order matters: literals are checked last.
const TOKENS = [
  { re: /^\d+/, desc: 'one or more digits' },
  { re: /^\d/, desc: 'a digit' },
  { re: /^\w+/, desc: 'one or more word characters' },
  { re: /^\w/, desc: 'a word character (letter, digit, underscore)' },
  { re: /^\s+/, desc: 'whitespace' },
  { re: /^\s/, desc: 'a whitespace character' },
  { re: /^\b\w+\b/, desc: 'a whole word' },
  { re: /^\[\^/, desc: 'any character not in the set…' },
  { re: /^\[/, desc: 'any character in the set…' },
  { re: /^\./, desc: 'any character' },
  { re: /^\^/, desc: 'start of the string' },
  { re: /\$$/, desc: 'end of the string' },
  { re: /^(\.\*)+/, desc: 'as much as possible (greedy)' },
  { re: /^.\*/, desc: 'anything (greedy)' },
  { re: /^.\+/, desc: 'anything, one or more (greedy)' },
  { re: /^.\?/, desc: 'optional' },
  { re: /^\(/, desc: 'capture group starts' },
  { re: /^\)/, desc: 'capture group ends' },
  { re: /^\|/, desc: 'or' },
  { re: /^\+/, desc: 'one or more' },
  { re: /^\*/, desc: 'zero or more' },
  { re: /^\?/, desc: 'optional (zero or one)' },
  { re: /^\{(\d+),?\d*\}/, desc: 'repeated a specific number of times' },
];

// Produce a human-readable, ordered list of descriptions for a pattern. This is
// a best-effort heuristic, not a full parser.
export function explain(pattern) {
  const steps = [];
  let rest = pattern;
  let guard = 0;
  while (rest.length > 0 && guard < 200) {
    guard += 1;
    let matched = false;
    for (const tok of TOKENS) {
      const m = rest.match(tok.re);
      if (m) {
        steps.push(tok.desc);
        rest = rest.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Consume a single literal character.
      steps.push(`the literal “${rest[0]}”`);
      rest = rest.slice(1);
    }
  }
  return steps;
}

// Quick validity check used to drive an error indicator.
export function isValid(pattern, flags = '') {
  return compile(pattern, flags).ok;
}
