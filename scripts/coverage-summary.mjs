import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const metrics = ['lines', 'statements', 'functions', 'branches']
const categories = [
  ['API consumers', ['src/api/']],
  ['Pages and routing', ['src/views/', 'src/router/']],
  ['UI components', ['src/components/', 'src/layouts/']],
  ['Services and state', ['src/services/', 'src/composables/', 'src/stores/']],
  ['Content and preview', ['src/content/', 'src/preview/']],
  ['Application setup', []],
]
const empty = () => Object.fromEntries(metrics.map((metric) => [metric, { total: 0, covered: 0 }]))
export const percentage = ({ covered, total }) => total ? `${(100 * covered / total).toFixed(2)}% (${covered}/${total})` : 'N/A'

export function summariseCoverage(report, root = process.cwd()) {
  const groups = Object.fromEntries([...categories.map(([name]) => name), 'Total'].map((name) => [name, empty()]))
  let files = 0
  for (const [filename, coverage] of Object.entries(report)) {
    if (filename === 'total') continue
    const relative = path.relative(root, filename).split(path.sep).join('/')
    if (!relative.startsWith('src/')) throw Error('Coverage report contains a file outside src/')
    const name = categories.find(([, prefixes]) => prefixes.some((prefix) => relative.startsWith(prefix)))?.[0] || 'Application setup'
    for (const metric of metrics) {
      const { total, covered } = coverage[metric]
      if (!Number.isInteger(total) || !Number.isInteger(covered) || covered < 0 || covered > total) throw Error('Invalid coverage counts')
      for (const group of [name, 'Total']) {
        groups[group][metric].total += total
        groups[group][metric].covered += covered
      }
    }
    files++
  }
  if (!files) throw Error('Coverage report contains no source files')
  return groups
}

export function markdown(groups) {
  return '# Frontend test coverage\n\nUnit/component coverage includes untested executable source files. Generated API types and type-only declarations are excluded. Browser acceptance runs separately and is not included in these percentages.\n\n| Category | Lines | Statements | Functions | Branches |\n| --- | --- | --- | --- | --- |\n' + Object.entries(groups).map(([name, values]) => `| ${name} | ${metrics.map((metric) => percentage(values[metric])).join(' | ')} |`).join('\n') + '\n\nDownload the frontend-coverage artifact for the HTML report (index.html), LCOV and machine-readable summaries. Reports describe this run and commit.\n'
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const groups = summariseCoverage(JSON.parse(await readFile('coverage/coverage-summary.json', 'utf8')))
  const summary = markdown(groups)
  await writeFile('coverage/category-summary.json', JSON.stringify(groups, null, 2) + '\n')
  await writeFile('coverage/category-summary.md', summary)
  console.log(summary)
}
