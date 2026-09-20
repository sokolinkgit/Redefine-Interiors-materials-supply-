#!/usr/bin/env node
/* =====================================================================================
 *  supabase/check-sql.mjs — a two-second pre-flight check before you paste schema.sql
 *  ------------------------------------------------------------------------------------
 *  PostgreSQL reads the WHOLE file before it runs ANY of it, so one stray line stops
 *  everything: "syntax error at or near …" and not a single table is touched. This
 *  script looks for the mistakes that cause that, using nothing but Node:
 *
 *    A. a commented-out statement that continues on LIVE lines
 *       (-- insert into … followed by an uncommented "(code, label, …) values …")
 *    B. an unterminated $$ … $$ function/DO body
 *    C. a statement whose brackets do not balance
 *    D. a file that does not end on a complete statement
 *
 *  RUN IT
 *      node supabase/check-sql.mjs                (checks supabase/schema.sql)
 *      node supabase/check-sql.mjs path/to.sql    (checks any other file)
 *
 *  It is a spell-checker, not a database: it cannot see whether a table or role exists
 *  (that is Supabase's job). Exit code 0 = nothing suspicious found.
 * ===================================================================================== */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || join(here, 'schema.sql');

let src;
try {
  src = readFileSync(file, 'utf8');
} catch (err) {
  console.error('Could not read ' + file + ' — ' + err.message);
  process.exit(1);
}

const lines = src.split('\n');
const problems = [];

/* ------------------------------------------------------------------ tokenizer ------ */
/* Walk the file once, knowing where comments, quotes and $$ bodies are, so the checks
   below never mistake text inside a string for SQL.                                   */
const STATEMENT_START =
  /^\s*(insert|update|delete|select|with|create|alter|drop|comment|grant|revoke|do|set|truncate|values|analyze|vacuum|begin|commit)\b/i;
const CONTINUATION = /^(\(|values\b|on conflict\b|where\b|set\b|returning\b|order by\b|group by\b|')/i;

let lineNo = 1;
let col = 0;
let state = 'sql'; // sql | line | block | dollar | sq | dq
let dollarTag = '';
let blockDepth = 0;
let stmtStart = 0;
let stmtParens = 0;
let statements = 0;

for (let i = 0; i < src.length; i++) {
  const ch = src[i];
  const next = src[i + 1];
  if (ch === '\n') { lineNo++; col = 0; if (state === 'line') state = 'sql'; continue; }
  col++;

  switch (state) {
    case 'line':
      continue;
    case 'block':
      if (ch === '/' && next === '*') { blockDepth++; i++; }
      else if (ch === '*' && next === '/') { blockDepth--; i++; if (blockDepth === 0) state = 'sql'; }
      continue;
    case 'dollar':
      if (ch === '$' && src.startsWith(dollarTag, i)) { i += dollarTag.length - 1; state = 'sql'; }
      continue;
    case 'sq':
      if (ch === "'" && next === "'") i++;
      else if (ch === "'") state = 'sql';
      continue;
    case 'dq':
      if (ch === '"' && next === '"') i++;
      else if (ch === '"') state = 'sql';
      continue;
    default:
      break;
  }

  /* state === 'sql' */
  if (ch === '-' && next === '-') { state = 'line'; i++; continue; }
  if (ch === '/' && next === '*') { state = 'block'; blockDepth = 1; i++; continue; }
  if (ch === "'") { state = 'sq'; continue; }
  if (ch === '"') { state = 'dq'; continue; }
  if (ch === '$') {
    const m = /^\$[A-Za-z_0-9]*\$/.exec(src.slice(i));
    if (m) { dollarTag = m[0]; state = 'dollar'; i += m[0].length - 1; continue; }
  }

  if (stmtStart === 0) stmtStart = lineNo;
  if (ch === '(') stmtParens++;
  if (ch === ')') stmtParens--;
  if (ch === ';') {
    statements++;
    if (stmtParens !== 0) {
      problems.push({
        line: stmtStart,
        what: 'brackets do not balance in the statement that starts here (' +
              (stmtParens > 0 ? stmtParens + ' unclosed "(" ' : Math.abs(stmtParens) + ' extra ")" ') + ')',
      });
    }
    stmtStart = 0; stmtParens = 0;
  }
}

/* ------------------------------------------------------------------- check B -------- */
if (state === 'dollar' || state === 'sq' || state === 'dq' || state === 'block') {
  problems.push({
    line: lineNo,
    what: state === 'dollar'
      ? 'a ' + dollarTag + ' … ' + dollarTag + ' body is never closed'
      : state === 'block'
        ? 'a /* … */ comment is never closed'
        : 'a quoted string is never closed',
  });
}

/* ------------------------------------------------------------------- check D -------- */
if (stmtStart !== 0) {
  problems.push({ line: stmtStart, what: 'the last statement is never finished with a ";"' });
}

/* ------------------------------------------------------------------- check A -------- */
/* A comment line that starts a statement, does not end it, and is followed by a LIVE
   line that can only be a continuation of it — i.e. the statement was only half
   commented out. This is exactly what produced
   'syntax error at or near "code"' in the legacy hero_slides seed.                     */
for (let i = 0; i < lines.length; i++) {
  const text = lines[i].trim();
  if (!text.startsWith('--')) continue;
  const body = text.replace(/^--+\s*/, '');
  if (!STATEMENT_START.test(body)) continue;
  if (body.endsWith(';') || body.endsWith('*/')) continue;

  let j = i + 1;
  while (j < lines.length && (!lines[j].trim() || lines[j].trim().startsWith('--'))) j++;
  if (j >= lines.length) continue;

  const live = lines[j].trim();
  if (STATEMENT_START.test(live)) continue;              // a new statement — fine
  if (!CONTINUATION.test(live)) continue;                // unrelated prose — fine
  problems.push({
    line: i + 1,
    what: 'this statement is commented out, but line ' + (j + 1) + ' below it is NOT: ' +
          JSON.stringify(live.slice(0, 60)) + '… — PostgreSQL will try to run it',
  });
}

/* --------------------------------------------------------------------- report ------- */
const rel = file.replace(process.cwd() + '/', '');
if (!problems.length) {
  console.log('OK — ' + rel + ': ' + statements + ' statements, no half-commented or unfinished SQL.');
  console.log('     Paste it into Supabase Studio → SQL Editor → Run.');
  process.exit(0);
}

problems.sort((a, b) => a.line - b.line);
console.error('PROBLEMS in ' + rel + ' — fix these before pasting into Supabase:\n');
for (const p of problems) {
  console.error('  line ' + String(p.line).padStart(4) + ': ' + p.what);
  console.error('           ' + (lines[p.line - 1] || '').trim().slice(0, 100));
}
console.error('\n  (' + problems.length + ' problem' + (problems.length === 1 ? '' : 's') +
              '; PostgreSQL parses the whole file first, so nothing runs until all of them are fixed.)');
process.exit(1);
