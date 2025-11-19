const fs = require('fs')
const path = require('path')

const WALK_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css'])

const repoRoot = path.resolve(__dirname, '..')

function walk(dir, cb) {
  const files = fs.readdirSync(dir)
  for (const f of files) {
    const p = path.join(dir, f)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      if (f === 'node_modules' || f === '.next' || f === '.git' || f === 'scripts') continue
      walk(p, cb)
    } else if (stat.isFile()) {
      const ext = path.extname(p)
      if (WALK_EXT.has(ext)) cb(p)
    }
  }
}

const results = []
walk(repoRoot, (file) => {
  const content = fs.readFileSync(file, 'utf8')
  // Find color-mix calls
  if (content.includes('color-mix(')) {
    results.push({ file, match: 'color-mix(' })
  }
  if (content.includes('bg-[var(--color-')) {
    results.push({ file, match: 'bg-[var(--color-...' })
  }
  if (content.includes("bg-[color-mix(")) {
    results.push({ file, match: "bg-[color-mix(" })
  }
})

if (results.length === 0) {
  console.log('No problematic theme usages found.')
  process.exit(0)
}

console.log('Found potential problematic theme CSS usages:')
for (const r of results) {
  console.log('-', r.file, r.match)
}
process.exit(1)
