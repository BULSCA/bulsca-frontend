/** Local browser acceptance checks. Requires the dev server and an isolated Chrome CDP session. */
import fs from 'node:fs/promises'
import process from 'node:process'
import { Buffer } from 'node:buffer'

const live = process.argv.includes('--live')
const origin = new URL(
  process.argv.find((arg) => arg.startsWith('--origin='))?.slice(9) ||
    `http://127.0.0.1:${live ? 5174 : 5173}`,
)
if (!['127.0.0.1', 'localhost'].includes(origin.hostname))
  throw Error('Use a local dev server, not a deployed site.')
const mode = live ? 'live' : 'preview'
const output = new URL(`../node_modules/.cache/bulsca-browser/${mode}/`, import.meta.url)
await fs.mkdir(output, { recursive: true })
const target = await (
  await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })
).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})
const pending = new Map(),
  listeners = new Map(),
  checks = [],
  visits = [],
  errors = [],
  requests = [],
  reports = [],
  apiRequests = []
let sequence = 0,
  responseMode = 'server',
  clubs,
  networkOffline = false
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id) {
    const task = pending.get(message.id)
    if (task) {
      clearTimeout(task.timer)
      pending.delete(message.id)
      if (message.error) task.reject(Error(JSON.stringify(message.error)))
      else task.resolve(message.result)
    }
  } else for (const listener of listeners.get(message.method) || []) listener(message.params)
})
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(Error(`Timed out: ${method}`))
    }, 20000)
    pending.set(id, { resolve, reject, timer })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
function on(event, listener) {
  listeners.set(event, [...(listeners.get(event) || []), listener])
}
async function evaluate(expression) {
  const value = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (value.exceptionDetails)
    throw Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text)
  return value.result.value
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function until(expression, timeout = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      if (await evaluate(expression)) return
    } catch (error) {
      if (!/context|navigat|closed/i.test(error.message)) throw error
    }
    await delay(100)
  }
  throw Error(`Condition not met: ${expression}`)
}
function check(name, pass, details) {
  checks.push({ name, pass: !!pass, ...(!pass ? { details } : {}) })
}
async function group(name, run) {
  try {
    await run()
  } catch (error) {
    check(name, false, error.message)
  }
  console.log(
    JSON.stringify({
      group: name,
      failures: checks.filter((item) => !item.pass).map((item) => item.name),
    }),
  )
}
async function navigate(path) {
  let previousDocument
  try {
    previousDocument = await evaluate('globalThis.__bulscaVerificationDocument')
  } catch (error) {
    if (!/context|navigat|closed/i.test(error.message)) throw error
  }
  await send('Page.navigate', { url: new URL(path, origin).href })
  await until(
    `globalThis.__bulscaVerificationDocument && globalThis.__bulscaVerificationDocument!==${JSON.stringify(previousDocument)} && location.pathname===${JSON.stringify(path.split('?')[0])} && !!document.querySelector('main h1') && !!document.querySelector('.mailing-list')`,
  )
  await until(`!document.querySelector('main [aria-busy="true"]')`)
  await evaluate(
    `Promise.race([document.fonts.ready, new Promise(resolve=>setTimeout(resolve,4000))])`,
  )
  await evaluate(`scrollTo(0,document.documentElement.scrollHeight)`)
  await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`)
  await evaluate(
    `Promise.all([...document.images].filter(img=>img.loading!=='lazy'||img.getBoundingClientRect().top<innerHeight).map(img=>img.complete?true:new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,2000)})))`,
  )
  await evaluate(
    `scrollTo(0,0);new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`,
  )
}
async function viewport(width) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 768,
  })
}
async function click(selector) {
  const point = await evaluate(
    `(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()`,
  )
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point })
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    button: 'left',
    clickCount: 1,
    ...point,
  })
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    button: 'left',
    clickCount: 1,
    ...point,
  })
}
async function fill(selector, value) {
  await evaluate(
    `(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))})()`,
  )
}
const active = () => evaluate(`document.querySelector('[data-slide-id]').dataset.slideId`)
const leaveCarousel = () => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 899 })
const route = (path) =>
  evaluate(`import('/src/router/index.ts').then(m=>m.default.push(${JSON.stringify(path)}))`)
async function screenshot(name, selector) {
  const clip = selector
    ? await evaluate(
        `(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1}})()`,
      )
    : undefined
  const result = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    ...(clip ? { clip } : {}),
  })
  await fs.writeFile(new URL(`${name}.png`, output), Buffer.from(result.data, 'base64'))
}
on('Runtime.exceptionThrown', (value) =>
  errors.push(value.exceptionDetails.exception?.description || value.exceptionDetails.text),
)
on('Network.requestWillBeSent', (value) => {
  requests.push(value.request.url)
  if (['XHR', 'Fetch'].includes(value.type)) apiRequests.push(value.request.url)
})
await send('Page.enable')
await send('Runtime.enable')
await send('Network.enable')
await send('Page.bringToFront')
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: 'globalThis.__bulscaVerificationDocument = Math.random().toString(36)',
})
if (live) {
  await send('Fetch.enable', {
    patterns: [
      { urlPattern: '*', resourceType: 'XHR' },
      { urlPattern: '*', resourceType: 'Fetch' },
    ],
  })
  on('Fetch.requestPaused', (value) => {
    if (networkOffline) {
      void send('Fetch.failRequest', {
        requestId: value.requestId,
        errorReason: 'InternetDisconnected',
      }).catch(() => {})
      return
    }
    const path = new URL(value.request.url).pathname
    let code =
      responseMode === 'missing'
        ? 404
        : responseMode === 'malformed'
          ? 200
          : responseMode === 'retry503'
            ? 503
            : 500
    let body =
      responseMode === 'malformed' ? { data: 'invalid' } : { message: 'Verification: unavailable' }
    if (path.endsWith('/client-errors')) {
      reports.push(JSON.parse(value.request.postData))
      code = 204
      body = null
    } else if (responseMode === 'recover' && path.endsWith('/clubs')) {
      code = 200
      body = clubs
    }
    void send('Fetch.fulfillRequest', {
      requestId: value.requestId,
      responseCode: code,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
      body: Buffer.from(body ? JSON.stringify(body) : '').toString('base64'),
    }).catch(() => {})
  })
}
async function inspect(path, width, expectedTitle) {
  const data = await evaluate(`(()=>{
    const box=el=>{if(!el)return null;const r=el.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,height:r.height}}
    const visible=el=>el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'
    const banner=document.querySelector('.page-banner'),parts=[banner?.querySelector('.banner-logo'),banner?.querySelector('.page-banner-content > div')].filter(visible).map(box)
    const mailing=document.querySelector('.mailing-list'),band=document.querySelector('.championship-band'),article=document.querySelector('.article-preview-link')
    return{heading:document.querySelector('main h1').textContent,headings:document.querySelectorAll('main h1').length,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,banner:box(banner),group:parts.length?{left:Math.min(...parts.map(r=>r.left)),right:Math.max(...parts.map(r=>r.right))}:null,
    mailing:box(mailing),email:box(mailing.querySelector('input[type=email]')),button:box(mailing.querySelector('button')),mailingBackground:getComputedStyle(mailing).backgroundColor,
    band:box(band),bandTitle:band?.querySelector('h2')?.textContent,
    broken:[...document.images].filter(img=>visible(img)&&img.complete&&!img.naturalWidth).map(img=>img.src),tiles:[...document.querySelectorAll('.navigation-tile')].map(box),cards:[...document.querySelectorAll('.card-frame')].map(card=>({card:box(card),action:box(card.querySelector('.card-action'))})),
    profiles:[...document.querySelectorAll('.committee-profile-card')].map(card=>({card:box(card),portrait:box(card.querySelector('.committee-portrait')),role:box(card.querySelector('.committee-role')),radius:getComputedStyle(card.querySelector('.committee-portrait')).borderRadius,nameSize:getComputedStyle(card.querySelector('.committee-profile-name')).fontSize})),articleDecoration:article?getComputedStyle(article).textDecorationLine:null}
  })()`)
  visits.push({ path, width, ...data })
  const label = `${width}px ${path}`
  check(label + ' one H1', data.headings === 1, data)
  if (expectedTitle)
    check(label + ' correct content', data.heading.includes(expectedTitle), data.heading)
  check(label + ' no horizontal overflow', data.scrollWidth <= data.clientWidth + 1, data)
  check(label + ' no broken images', data.broken.length === 0, data.broken)
  check(
    label + ' mailing controls fit',
    data.email.left >= data.mailing.left &&
      data.email.right <= data.mailing.right &&
      Math.abs(data.email.width - data.button.width) < 2 &&
      data.button.height >= 44,
    data,
  )
  check(label + ' mailing card contrast', data.mailingBackground === 'rgb(255, 255, 255)', data)
  if (data.banner)
    check(
      label + ' centred banner group',
      Math.abs(
        (data.group.left + data.group.right) / 2 - (data.banner.left + data.banner.width / 2),
      ) < 2,
      data,
    )
  if (path === '/')
    check(
      label + ' championship publication',
      live
        ? !data.band
        : data.band &&
            data.band.left === 0 &&
            Math.abs(data.band.width - data.clientWidth) < 2 &&
            data.bandTitle === 'Champs 2027',
      data,
    )
  check(
    label + ' large navigation tiles',
    data.tiles.every((tile) => tile.height >= 180),
    data.tiles,
  )
  check(
    label + ' card footer actions fit',
    data.cards.every(
      ({ card, action }) =>
        !action || (Math.abs(action.width - card.width + 2) < 2 && action.height >= 44),
    ),
    data.cards,
  )
  check(
    label + ' original profile proportions',
    data.profiles.every(
      ({ card, portrait, role, radius, nameSize }) =>
        card.width <= 225 &&
        card.height >= 319 &&
        Math.abs(portrait.width - portrait.height) < 1 &&
        radius === '50%' &&
        Math.abs(role.width - card.width + 2) < 2 &&
        role.height >= 44 &&
        nameSize === '24px',
    ),
    data.profiles,
  )
  if (data.articleDecoration !== null)
    check(label + ' no underline across whole article', data.articleDecoration === 'none', data)
}
try {
  await navigate('/')
  const correctMode = (await evaluate(`!!document.querySelector('.preview-banner')`)) !== live
  check('correct data mode', correctMode)
  if (!correctMode)
    throw Error('Data mode mismatch: refusing to exercise forms in an unexpected mode.')
  const cases = live
    ? [
        '/',
        '/about',
        '/latest',
        '/competitions/calendar',
        '/competitions/league',
        '/resources',
        '/contact-form',
        '/portal',
        '/get-involved/committee',
        '/get-involved/committee/2025-26',
        '/get-involved/committee/2026-27/alex-example.1',
      ]
    : await evaluate(`import('/src/router/routes.ts').then(m=>m.publicPageCases)`)
  for (const width of process.argv.includes('--interactions-only')
    ? []
    : [320, 375, 640, 768, 1024, 1440]) {
    await viewport(width)
    for (const [path, expectedTitle] of [
      ...(live ? cases.map((path) => [path, undefined]) : cases),
      ['/this-page-does-not-exist', 'Page not found'],
    ]) {
      await navigate(path)
      await inspect(path, width, expectedTitle)
    }
    console.log(
      JSON.stringify({
        mode,
        width,
        visits: visits.length,
        failures: checks.filter((item) => !item.pass).map((item) => item.name),
      }),
    )
  }
  await viewport(375)
  if (!live) {
    await group('carousel playback and focus', async () => {
      await navigate('/')
      await leaveCarousel()
      const first = await active()
      await until(
        `document.querySelector('[data-slide-id]').dataset.slideId!==${JSON.stringify(first)}`,
        8500,
      )
      check('automatic six-second rotation', true)
      const hoverPoint = await evaluate(
        `(()=>{const r=document.querySelector('.home-carousel').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()`,
      )
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...hoverPoint })
      const hovered = await active()
      await delay(6400)
      check('hover pauses automatic rotation', (await active()) === hovered)
      await leaveCarousel()
      await until(
        `document.querySelector('[data-slide-id]').dataset.slideId!==${JSON.stringify(hovered)}`,
        8500,
      )
      check('leaving hover resumes rotation', true)
      await click('button[aria-label="Next slide"]')
      const manual = await active()
      await leaveCarousel()
      await delay(6400)
      check('manual navigation stays paused', (await active()) === manual)
      await click('button[aria-label="Play slideshow"]')
      const playing = await active()
      await leaveCarousel()
      await delay(6400)
      check('Play resumes with button retaining focus', (await active()) !== playing)
    })
    await group('keyboard and reduced motion', async () => {
      await navigate('/')
      await evaluate(`document.querySelector('.home-carousel').focus()`)
      let before = await active()
      await delay(6300)
      check('keyboard focus pauses rotation', (await active()) === before)
      await send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'ArrowRight',
        code: 'ArrowRight',
        windowsVirtualKeyCode: 39,
      })
      await send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'ArrowRight',
        code: 'ArrowRight',
        windowsVirtualKeyCode: 39,
      })
      check('arrows change slides', (await active()) !== before)
      await send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      })
      await navigate('/')
      before = await active()
      await leaveCarousel()
      await delay(6300)
      check('reduced motion prevents automatic rotation', (await active()) === before)
      check(
        'reduced motion disables autoplay',
        await evaluate(`document.querySelector('.carousel-play').disabled`),
      )
      await click('button[aria-label="Next slide"]')
      check('manual reduced-motion navigation works', (await active()) !== before)
      await send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
      })
    })
    await group('mobile navigation', async () => {
      await navigate('/')
      await click('.menu-toggle')
      check(
        'mobile menu opens',
        await evaluate(
          `document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true'`,
        ),
      )
      await click('#site-navigation details summary')
      await click('#site-navigation a[href="/competitions/calendar"]')
      await until(
        `location.pathname==='/competitions/calendar' && !!document.querySelector('.competition-card')`,
      )
      check(
        'navigation closes menu',
        await evaluate(
          `document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false'`,
        ),
      )
      await click('.menu-toggle')
      await send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Escape',
        code: 'Escape',
        windowsVirtualKeyCode: 27,
      })
      check(
        'Escape closes menu',
        await evaluate(
          `document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false'`,
        ),
      )
    })
    await group('search downloads and history', async () => {
      await navigate('/resources/search')
      await fill('input[name=q]', 'not-a-resource')
      await click('form[role=search] button')
      await until(`document.querySelector('main').textContent.includes('No matching items')`)
      check('search empty state', true)
      await fill('input[name=q]', 'entry')
      await click('form[role=search] button')
      await until(`!!document.querySelector('main a[href="/resources/view/sample-entry-pack"]')`)
      check(
        'search query persists in URL',
        await evaluate(`new URLSearchParams(location.search).get('q')==='entry'`),
      )
      await click('main a[href="/resources/view/sample-entry-pack"]')
      await until(`location.pathname==='/resources/view/sample-entry-pack'`)
      await click('section[aria-label="Document access"] button')
      await until(`!!document.querySelector('a[href="/preview/sample-resource.txt"]')`)
      check(
        'prepared download is readable',
        await evaluate(
          `fetch(document.querySelector('a[href="/preview/sample-resource.txt"]').href).then(async r=>r.ok&&(await r.text()).includes('BULSCA'))`,
        ),
      )
      await evaluate('history.back()')
      await until(
        `location.pathname==='/resources/search'&&document.querySelector('input[name=q]')?.value==='entry'`,
      )
      check('Back restores search', true)
    })
    await group('committee profiles', async () => {
      await navigate('/get-involved/committee')
      await click('.committee-profile-card')
      await until(`!!document.querySelector('.committee-biography')`)
      check(
        'card opens member biography',
        await evaluate(`document.querySelector('main h1').textContent==='Alex Example'`),
      )
      check(
        'role band spans page',
        await evaluate(
          `Math.abs(document.querySelector('.page-section--brand').getBoundingClientRect().width-document.documentElement.clientWidth)<2`,
        ),
      )
      await click('main a.action-button')
      await until(`!!document.querySelector('.committee-profiles')`)
      check(
        'Back stays in the member season',
        await evaluate(`location.pathname==='/get-involved/committee/2026-27'`),
      )
      await navigate('/get-involved/committee/2025-26')
      check(
        'historical links retain season',
        await evaluate(
          `[...document.querySelectorAll('.committee-profile-card')].every(a=>a.getAttribute('href').includes('/2025-26/'))`,
        ),
      )
    })
    await group('news filters and history', async () => {
      await navigate('/latest')
      await click('.article-card button')
      await until(`location.search.includes('tag=preview')`)
      await click('.article-card .card-action')
      await until(
        `location.pathname.startsWith('/article/')&&!!document.querySelector('.article-copy')`,
      )
      check('news card opens article', true)
      await evaluate('history.back()')
      await until(`location.pathname==='/latest'&&location.search.includes('tag=preview')`)
      check('news filter survives Back', true)
    })
    await group('safe preview forms', async () => {
      await navigate('/contact-form')
      await click('.contact-form button[type=submit]')
      check(
        'contact validates required fields',
        await evaluate(`!!document.querySelector('.field-error')?.textContent`),
      )
      for (const [selector, value] of [
        ['#name', 'Browser Test'],
        ['#email', 'browser@example.test'],
        ['#subject', 'Preview verification'],
        ['#message', 'Preview-only verification message.'],
      ])
        await fill(selector, value)
      await click('.contact-form button[type=submit]')
      await until(
        `document.querySelector('main').textContent.includes('your message was not sent')`,
      )
      check('contact preview sends nothing', true)
      await fill('.mailing-list input[type=email]', 'browser@example.test')
      await click('.mailing-list button')
      await until(
        `document.querySelector('.mailing-list [role=status]')?.textContent.includes('no mailing-list subscription')`,
      )
      check('newsletter preview sends nothing', true)
      check('no Mailchimp request', !requests.some((url) => url.includes('list-manage.com')))
    })
    await group('session banners and image fallback', async () => {
      await navigate('/about')
      const photo = await evaluate(
        `document.querySelector('.page-banner .hero-photo').getAttribute('src')`,
      )
      await route('/about?q=check#top')
      check(
        'query/hash retain banner',
        (await evaluate(
          `document.querySelector('.page-banner .hero-photo').getAttribute('src')`,
        )) === photo,
      )
      await route('/contact')
      await route('/about')
      check(
        'return visit retains banner',
        (await evaluate(
          `document.querySelector('.page-banner .hero-photo').getAttribute('src')`,
        )) === photo,
      )
      await navigate('/about')
      check(
        'reload retains banner',
        (await evaluate(
          `document.querySelector('.page-banner .hero-photo').getAttribute('src')`,
        )) === photo,
      )
      await evaluate(
        `document.querySelector('.page-banner .hero-photo').dispatchEvent(new Event('error'))`,
      )
      await until(
        `document.querySelector('.page-banner .hero-photo')?.getAttribute('src')!==${JSON.stringify(photo)}`,
      )
      check(
        'broken banner recovers with heading intact',
        await evaluate(`!!document.querySelector('main h1')`),
      )
    })
    for (const width of [320, 1440]) {
      await viewport(width)
      for (const [name, path] of [
        ['home', '/'],
        ['latest', '/latest'],
        ['committee', '/get-involved/committee'],
        ['profile', '/get-involved/committee/2026-27/alex-example.1'],
      ]) {
        await navigate(path)
        await screenshot(`${name}-${width}`)
      }
      await navigate('/')
      await screenshot(`footer-${width}`, 'footer.site-footer')
      await screenshot(`champs-${width}`, '.championship-band')
    }
    check(
      'preview makes no API calls',
      !requests.some((url) => new URL(url).pathname.startsWith('/api/')),
    )
  } else {
    await group('live API failures retries reconnection and diagnostics', async () => {
      responseMode = 'server'
      await navigate('/get-involved/clubs')
      await until(`!!document.querySelector('main [role=alert]')`)
      check(
        '500 retains navigation and retry',
        await evaluate(
          `!!document.querySelector('.site-header')&&!!document.querySelector('main [role=alert] button')`,
        ),
      )
      clubs = await evaluate(
        `import('/src/preview/service.ts').then(m=>m.previewResponse('clubs',{},{}))`,
      )
      responseMode = 'recover'
      await click('main [role=alert] button')
      await until(`!!document.querySelector('a[href="/get-involved/clubs/example-university.1"]')`)
      check('retry recovers data', true)
      responseMode = 'server'
      await fill('input[name=q]', 'failed-filter')
      await click('form[role=search] button')
      await until(`document.querySelector('main').textContent.includes('previously loaded')`)
      check(
        'failed filter retains old results',
        await evaluate(
          `document.querySelector('main').textContent.includes('Example University Lifesaving')`,
        ),
      )
      responseMode = 'missing'
      await navigate('/resources')
      await until(`!!document.querySelector('main [role=alert]')`)
      check(
        '404 API keeps the resource page',
        await evaluate(`document.querySelector('main h1').textContent==='Resources'`),
      )
      responseMode = 'malformed'
      await navigate('/competitions/calendar')
      await until(`!!document.querySelector('main [role=alert]')`)
      check(
        'malformed payload retains banner',
        await evaluate(`!!document.querySelector('.page-banner')`),
      )
      responseMode = 'retry503'
      const before = apiRequests.filter((url) => new URL(url).pathname.endsWith('/clubs')).length
      await navigate('/get-involved/clubs')
      await until(`!!document.querySelector('main [role=alert]')`)
      check(
        '503 retries exactly twice',
        apiRequests.filter((url) => new URL(url).pathname.endsWith('/clubs')).length - before === 3,
        {
          before,
          after: apiRequests.filter((url) => new URL(url).pathname.endsWith('/clubs')).length,
        },
      )
      responseMode = 'recover'
      await click('main [role=alert] button')
      await until(`!!document.querySelector('a[href="/get-involved/clubs/example-university.1"]')`)
      networkOffline = true
      await send('Network.emulateNetworkConditions', {
        offline: true,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      })
      await fill('input[name=q]', 'offline-filter')
      await click('form[role=search] button')
      await until(`document.querySelector('main').textContent.includes('previously loaded')`)
      check(
        'offline retains existing directory',
        await evaluate(
          `document.querySelector('main').textContent.includes('Example University Lifesaving')`,
        ),
      )
      networkOffline = false
      await send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      })
      await click('main [role=alert] button')
      await until(`!document.querySelector('main [role=alert]')`)
      check('reconnection recovers directory', true)
      responseMode = 'server'
      await navigate('/contact-form')
      await until(`!!document.querySelector('main [role=alert]')`)
      check(
        'unavailable contact retains email fallback',
        await evaluate(
          `!!document.querySelector('main a[href^="mailto:"]')&&document.querySelector('.contact-form button[type=submit]').disabled`,
        ),
      )
      check('backend diagnostics are attempted', reports.length > 0)
      check(
        'diagnostics omit query strings and form contents',
        reports.every(
          (report) =>
            !report.route_template.includes('?') &&
            !JSON.stringify(report).includes('browser@example.test'),
        ),
      )
    })
  }
  check('no uncaught browser errors', errors.length === 0, errors)
} catch (error) {
  check('runner completed', false, error.stack)
} finally {
  await fs.writeFile(
    new URL('report.json', output),
    JSON.stringify({ mode, checks, visits, errors, requests, reports }, null, 2),
  )
  console.log(
    JSON.stringify({
      mode,
      visits: visits.length,
      checks: checks.length,
      failures: checks.filter((item) => !item.pass),
    }),
  )
  await fetch(`http://127.0.0.1:9222/json/close/${target.id}`)
  ws.close()
}
process.exitCode = checks.some((item) => !item.pass) ? 1 : 0
