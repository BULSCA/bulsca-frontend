/** Real Laravel + Vue acceptance. APIs are never intercepted; only external providers are blocked. */
import fs from 'node:fs/promises'
import process from 'node:process'
const manifest = JSON.parse(await fs.readFile(process.argv[2], 'utf8'))
const output = process.argv[3]
const origin = 'http://127.0.0.1:5175'
const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }) })
let sequence = 0
const pending = new Map(), checks = [], visits = [], apiResponses = [], runtimeErrors = []
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`Timeout: ${method}`)) }, 20000)
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }))
  })
}
ws.addEventListener('message', ({ data }) => {
  const event = JSON.parse(data)
  if (event.id) {
    const task = pending.get(event.id)
    if (task) { clearTimeout(task.timer); pending.delete(event.id); if (event.error) task.reject(Error(JSON.stringify(event.error))); else task.resolve(event.result) }
  } else if (event.method === 'Network.responseReceived' && event.params.response.url.includes('/api/v1/')) {
    apiResponses.push({ url: new URL(event.params.response.url).pathname, status: event.params.response.status })
  } else if (event.method === 'Runtime.exceptionThrown') runtimeErrors.push(event.params.exceptionDetails.text)
  else if (event.method === 'Fetch.requestPaused') {
    // Zero external calls: font/image failures exercise the site's existing fallbacks.
    void send('Fetch.fulfillRequest', { requestId: event.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/plain' }], body: '' })
  }
})
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
  return result.result.value
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
async function until(expression) {
  const start = Date.now()
  while (Date.now() - start < 15000) {
    try { if (await evaluate(expression)) return } catch (error) { if (!/context|navigat/i.test(error.message)) throw error }
    await delay(100)
  }
  throw Error(`Condition not met: ${expression}`)
}
function check(name, passed) { checks.push({ name, pass: !!passed }); if (!passed) throw Error(name) }
async function navigate(path) {
  const previous = await evaluate('globalThis.__bulscaApiDocument').catch(() => undefined)
  await send('Page.navigate', { url: origin + path })
  await until(`globalThis.__bulscaApiDocument && globalThis.__bulscaApiDocument!==${JSON.stringify(previous)} && location.pathname===${JSON.stringify(path.split('?')[0])} && !!document.querySelector('main h1') && !document.querySelector('main [aria-busy="true"]')`)
}
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
  await send('Fetch.enable', { patterns: [{ urlPattern: 'https://*' }] })
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `globalThis.__bulscaApiDocument=crypto.randomUUID();window.turnstile={render:(_element,options)=>{queueMicrotask(()=>options.callback('integration-token'));return 'test-widget'},remove:()=>{}}` })
  const staticPaths = ['/about', '/about/records', '/freshers', '/get-involved', '/get-involved/clubs/create', '/competitions', '/resources/forms', '/welfare', '/welfare/support-and-reporting', '/welfare/inclusion-and-accessibility', '/contact', '/privacy-policy', '/data-deletion', '/cookies', '/terms-of-service', '/meta-content/feed']
  for (const width of [320, 375, 640, 768, 1024, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 })
    for (const [path, text] of [...manifest.paths, ...staticPaths.map(path => [path, ''])]) {
      await navigate(path)
      if (text) await until(`document.querySelector('main').innerText.toLowerCase().includes(${JSON.stringify(text.toLowerCase())})`)
      check(`${width} ${path}: real content`, !text || await evaluate(`document.querySelector('main').innerText.toLowerCase().includes(${JSON.stringify(text.toLowerCase())})`))
      check(`${width} ${path}: usable navigation`, await evaluate(`!!document.querySelector('nav') && !!document.querySelector('footer')`))
      check(`${width} ${path}: no overflow`, await evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
      visits.push({ path, width })
    }
    console.log(JSON.stringify({ width, visits: visits.length }))
  }
  await navigate('/resources/view/' + manifest.resource_id)
  await evaluate(`document.querySelector('main button').click()`)
  await until(`!!document.querySelector('section[aria-label="Document access"] a')`)
  const file = await evaluate(`(async()=>{const response=await fetch(document.querySelector('section[aria-label="Document access"] a').href);return {status:response.status,body:await response.text()}})()`)
  check('Real document download', file.status === 200 && file.body.includes('isolated integration document'))
  await navigate('/article/' + manifest.article_slug)
  await until(`!!document.querySelector('.article-actions button')`)
  await evaluate(`document.querySelector('.article-actions button').click()`)
  await until(`document.querySelector('.article-actions').innerText.includes('Thank you')`)
  check('Real article rating', await evaluate(`document.querySelector('.article-actions').innerText.includes('Helpful (1)')`))
  await navigate('/contact-form')
  await until(`!!document.querySelector('main .contact-form button[type="submit"]:not(:disabled)')`)
  await evaluate(`(()=>{for(const [name,value] of Object.entries({name:'Integration Visitor',email:'visitor@example.test',subject:'Integration test',message:'Local test only'})){const el=document.querySelector('main #'+name);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))}const form=document.querySelector('main form');form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))})()`)
  await until(`!!document.querySelector('main .success-message')`)
  check('Real contact endpoint with fake external providers', true)
  const missing = await evaluate(`fetch('/api/v1/clubs/unknown.999999').then(async response=>({status:response.status,body:await response.json()}))`)
  check('Real API missing response is safe and correlated', missing.status === 404 && !!missing.body.request_id)
  check('No unexpected API failures', apiResponses.filter(response => response.status >= 400 && response.url !== '/api/v1/clubs/unknown.999999').length === 0)
  await send('Network.setExtraHTTPHeaders', { headers: { 'X-Public-Test-Failure': 'clubs' } })
  await navigate('/get-involved/clubs')
  await until(`!!document.querySelector('main [role="alert"]')`)
  check('Actual Laravel failure retains the public page', await evaluate(`document.querySelector('main h1').innerText.includes('University clubs') && !!document.querySelector('nav')`))
  const failure = await evaluate(`fetch('/api/v1/clubs').then(async response=>({status:response.status,body:await response.json(),requestId:response.headers.get('X-Request-ID')}))`)
  check('Actual Laravel failure is safe and correlated', failure.status === 500 && failure.body.request_id === failure.requestId && !JSON.stringify(failure.body).includes('Injected'))
  await send('Network.setExtraHTTPHeaders', { headers: {} })
  await navigate('/get-involved/clubs')
  await until(`document.querySelector('main').innerText.includes('Test University')`)
  check('Actual backend recovery restores content', true)
  check('No browser runtime exceptions', runtimeErrors.length === 0)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  await fs.writeFile(output + '/integration.png', Buffer.from(shot.data, 'base64'))
} catch (error) {
  checks.push({ name: 'integration completion', pass: false, error: error.message })
  await fs.writeFile(output + '/failure-page.txt', await evaluate('document.body.innerText').catch(() => 'Page unavailable'))
  const shot = await send('Page.captureScreenshot', { format: 'png' }).catch(() => null)
  if (shot) await fs.writeFile(output + '/failure.png', Buffer.from(shot.data, 'base64'))
  process.exitCode = 1
} finally {
  await fs.writeFile(output + '/report.json', JSON.stringify({ visits, checks, apiResponses, runtimeErrors }, null, 2))
  console.log(JSON.stringify({ visits: visits.length, checks: checks.length, failures: checks.filter(check => !check.pass) }))
  await send('Page.close').catch(() => {})
  ws.close()
}
