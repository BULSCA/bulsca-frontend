import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summariseCoverage, percentage, markdown } from './coverage-summary.mjs'

const counts = (covered, total) => Object.fromEntries(['lines', 'statements', 'functions', 'branches'].map((name) => [name, { covered, total }]))
test('category totals are weighted by executable counts, including untested files', () => {
  const result = summariseCoverage({ '/repo/src/api/client.ts': counts(1, 1), '/repo/src/api/untested.ts': counts(0, 99), '/repo/src/views/Home.vue': counts(5, 10) }, '/repo')
  assert.equal(percentage(result['API consumers'].lines), '1.00% (1/100)')
  assert.equal(percentage(result.Total.lines), '5.45% (6/110)')
  assert.match(markdown(result), /Pages and routing \| 50.00%/)
})
test('the provider total row is not counted twice', () => {
  const result = summariseCoverage({ total: counts(1, 2), '/repo/src/main.ts': counts(1, 2) }, '/repo')
  assert.deepEqual(result.Total.lines, { covered: 1, total: 2 })
})
test('empty categories have no invented coverage percentage', () => {
  assert.equal(percentage({ covered: 0, total: 0 }), 'N/A')
})
test('empty, invalid or out-of-scope reports cannot produce a passing summary', () => {
  assert.throws(() => summariseCoverage({ total: counts(0, 0) }, '/repo'), /no source files/)
  assert.throws(() => summariseCoverage({ '/repo/src/main.ts': counts(2, 1) }, '/repo'), /Invalid coverage/)
  assert.throws(() => summariseCoverage({ '/repo/tests/test.ts': counts(1, 1) }, '/repo'), /outside src/)
})
