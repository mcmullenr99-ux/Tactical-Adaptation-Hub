# TypeScript String Safety — Apostrophe & Special Character Rule

**Created:** 2026-03-27  
**Applies to:** All `.ts` and `.tsx` files in the project, especially `ribbonLibrary.ts`

---

## The Problem

TypeScript/JavaScript uses **single quotes** `'` to delimit strings. If a string *value* contains an apostrophe (e.g. `Soldier's`, `King's`, `O'Brien`), the compiler reads it as the **end of the string** mid-word, causing a syntax error that **crashes the entire build** — nothing deploys until it's fixed.

Example of broken code:
```ts
{ name: 'Soldier's Medal Ribbon' }
//              ^ TypeScript thinks the string ends here
```

Example of correct code:
```ts
{ name: 'Soldier\'s Medal Ribbon' }
//              ^ backslash escapes the apostrophe
```

---

## The Rule

**Before committing any changes to `.ts` / `.tsx` files:**

1. Scan the modified file for any unescaped apostrophes inside single-quoted strings
2. Replace every `'` (apostrophe) inside a single-quoted string with `\'`
3. This includes curly/smart apostrophes `'` — convert those to `\'` as well
4. Do NOT escape apostrophes inside double-quoted strings `"` or template literals `` ` `` — only single-quoted strings need it

---

## Automated Scan Command

Run this before every commit to catch any unescaped apostrophes:

```python
python3 << 'PYEOF'
import re, sys

files = sys.argv[1:] if len(sys.argv) > 1 else ['/app/src/lib/ribbonLibrary.ts']
issues = []

for filepath in files:
    with open(filepath) as f:
        lines = f.readlines()
    for i, line in enumerate(lines, 1):
        # Find single-quoted strings containing unescaped apostrophes
        # Match: ' then any chars, then an apostrophe NOT preceded by backslash, then more chars, then '
        if re.search(r"'[^'\\]*(?<!\\)'[^'\\]*(?<!\\)'", line):
            issues.append((filepath, i, line.strip()))

if issues:
    print(f"FAIL: {len(issues)} lines with potential unescaped apostrophes:")
    for f, n, l in issues:
        print(f"  {f}:{n}  {l}")
    sys.exit(1)
else:
    print("OK: No unescaped apostrophes found")
PYEOF
```

---

## Auto-Fix Command

To automatically escape all apostrophes in a file:

```python
python3 << 'PYEOF'
import re

filepath = '/app/src/lib/ribbonLibrary.ts'

with open(filepath) as f:
    content = f.read()

# Find single-quoted string values and escape any unescaped apostrophes inside them
# Strategy: process character by character to be precise
def escape_apostrophes_in_single_quoted_strings(text):
    result = []
    in_string = False
    i = 0
    while i < len(text):
        ch = text[i]
        if not in_string and ch == "'":
            in_string = True
            result.append(ch)
        elif in_string and ch == '\\':
            # Escaped char - keep as-is and skip next
            result.append(ch)
            i += 1
            result.append(text[i])
        elif in_string and ch == "'":
            in_string = False
            result.append(ch)
        elif in_string and ch in ("'", "\u2019"):  # apostrophe or curly apostrophe
            result.append("\\'")
        else:
            result.append(ch)
        i += 1
    return ''.join(result)

fixed = escape_apostrophes_in_single_quoted_strings(content)

with open(filepath, 'w') as f:
    f.write(fixed)

print("Done - all apostrophes escaped")
PYEOF
```

---

## Why It's Catastrophic

- `esbuild` (Vite's compiler) parses ALL files before outputting anything
- One syntax error in one file = **entire build fails**, zero output
- Cloudflare Pages gets an exit code 1 → marks the deployment as failed
- The live site is unaffected (it stays on the last good build), but nothing new deploys until fixed
- There is no partial deployment — it's all or nothing

---

## Notes

- The `ribbonLibrary.ts` file is the highest-risk file because it contains hundreds of medal/ribbon names from many countries, and names like `King's`, `Queen's`, `Soldier's`, `O'Brien's` are common
- Always use the scan command after any bulk edits to that file
- If adding new ribbons manually or via script, run the auto-fix before committing
