// Проверка собранного интерфейса: npm run build && node scripts/check-catalog.mjs
// Нужен установленный Chrome или Edge. Зависимости не требуются.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const root = fileURLToPath(new URL('../dist/', import.meta.url))
assert(existsSync(path.join(root, 'index.html')), 'Сначала выполните npm run build')
const chromePath = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
].find((file) => file && existsSync(file))
assert(chromePath, 'Chrome/Edge не найден. Укажите CHROME_PATH')
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
}
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (!file.startsWith(root) || !existsSync(file)) {
    res.writeHead(404)
    res.end()
    return
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
  res.end(readFileSync(file))
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const profile = mkdtempSync(path.join(tmpdir(), 'handoff-check-'))
const browser = spawn(
  chromePath,
  [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
)
let socket
try {
  const portFile = path.join(profile, 'DevToolsActivePort')
  for (let i = 0; !existsSync(portFile) && i < 100; i++) {
    await delay(100)
  }
  const port = readFileSync(portFile, 'utf8').split('\n')[0]
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })
  let id = 0
  const pending = new Map()
  const runtimeErrors = []
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.method === 'Runtime.exceptionThrown') {
      runtimeErrors.push(message.params.exceptionDetails)
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      runtimeErrors.push(message.params.args)
    }
    if (pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
  }
  async function send(method, params = {}) {
    const requestId = ++id
    const result = new Promise((resolve) => pending.set(requestId, resolve))
    socket.send(JSON.stringify({ id: requestId, method, params }))
    const reply = await result
    assert(!reply.error, JSON.stringify(reply.error))
    return reply.result
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const click = async (selector) => {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
    await delay(80)
    const markupErrors = await evaluate(`(() => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id)
      const duplicateIds = ids.filter((value, index) => ids.indexOf(value) !== index)
      const nestedControls = [...document.querySelectorAll('button button, button a, a button, a a, form form, label label')]
        .map(element => element.outerHTML.slice(0, 180))
      return { duplicateIds, nestedControls }
    })()`)
    assert.deepEqual(
      markupErrors,
      { duplicateIds: [], nestedControls: [] },
      'Некорректная HTML-вложенность или повторяющиеся id',
    )
  }
  const count = () => evaluate('document.querySelectorAll(".equipment-card").length')
  const address = server.address()
  await send('Runtime.enable')
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}` })
  for (
    let i = 0;
    i < 100 && !(await evaluate('Boolean(document.querySelector(".equipment-card"))'));
    i++
  ) {
    await delay(100)
  }
  assert.equal(await count(), 4)
  for (const width of [1440, 1024, 820, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    })
    assert(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      `Переполнение при ${width}px`,
    )
    assert(
      await evaluate(
        '[...document.querySelectorAll(".equipment-media img")].every(i => i.complete && i.naturalWidth > 0)',
      ),
      'Изображения не загружены',
    )
  }
  await click('.category-button:nth-child(2)')
  assert.equal(await count(), 2)
  await click('.category-button:nth-child(5)')
  assert.equal(await count(), 0)
  assert(await evaluate('Boolean(document.querySelector(".catalog-empty"))'))
  await click('.clear-button')
  await evaluate(
    `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(document.querySelector('input[type=search]'), 'hdmi'); document.querySelector('input[type=search]').dispatchEvent(new Event('input', { bubbles: true }))`,
  )
  await delay(80)
  assert.equal(await count(), 3)
  await click('.clear-button')
  await evaluate(
    `document.querySelector('.select-control select').value = 'Б'; document.querySelector('.select-control select').dispatchEvent(new Event('change', { bubbles: true }))`,
  )
  await delay(80)
  assert.equal(await count(), 1)
  await click('.clear-button')
  await evaluate(
    `document.querySelector('.sort-control select').value = 'name'; document.querySelector('.sort-control select').dispatchEvent(new Event('change', { bubbles: true }))`,
  )
  await delay(80)
  assert.equal(
    await evaluate('document.querySelector(".equipment-card h3").textContent'),
    'Кабель HDMI',
  )
  await click('.clear-button')
  await click('.details-link')
  assert(
    await evaluate('Boolean(document.querySelector(".equipment-page"))'),
    'Карточка не открылась',
  )
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Проектор Epson EB-X24')
  assert.equal(await evaluate('document.querySelectorAll(".calendar-day.is-selected").length'), 3)
  assert.equal(
    await evaluate('document.querySelector(".booking-summary dd").textContent'),
    '18–20 ноября',
  )
  for (const width of [1440, 1024, 820, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 940,
      deviceScaleFactor: 1,
      mobile: false,
    })
    assert(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      `Переполнение карточки при ${width}px`,
    )
    if (process.argv.includes('--screenshots') && [1440, 390].includes(width)) {
      const layout = await send('Page.getLayoutMetrics')
      const screenshot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height: layout.cssContentSize.height, scale: 1 },
      })
      writeFileSync(
        path.join(tmpdir(), `handoff-equipment-${width}.png`),
        Buffer.from(screenshot.data, 'base64'),
      )
    }
  }
  await click('.add-to-request')
  assert.equal(await evaluate('document.querySelector(".draft-count").textContent'), '1')
  assert(await evaluate('document.querySelector(".add-to-request").disabled'))
  await click('.add-accessory')
  assert.equal(await evaluate('document.querySelector(".draft-count").textContent'), '2')
  await click('.student-nav a[href="#/requests"]')
  await click('.draft-request-card a')
  assert.equal(await evaluate('document.querySelectorAll(".request-equipment").length'), 2)
  await click('.remove-equipment')
  assert.equal(await evaluate('document.querySelectorAll(".request-equipment").length'), 1)
  await evaluate('window.location.hash = "/equipment/035"')
  await delay(80)
  await click('[data-date="2026-11-12"]')
  assert(await evaluate('document.querySelector(".add-to-request").disabled'))
  await click('[data-date="2026-11-16"]')
  assert(
    await evaluate('document.querySelector(".add-to-request").disabled'),
    'Нельзя бронировать период с занятыми днями внутри',
  )
  assert.equal(
    await evaluate('document.querySelector(".availability-badge").textContent'),
    'Занято на эти даты',
  )
  await click('[data-date="2026-11-18"]')
  await click('[data-date="2026-11-20"]')
  assert.equal(await evaluate('document.querySelector(".add-to-request").disabled'), false)
  await click('[aria-label="Следующие три недели"]')
  assert.equal(await evaluate('document.querySelector(".calendar-day").dataset.date'), '2026-11-30')
  await click('[aria-label="Предыдущие три недели"]')
  assert.equal(await evaluate('document.querySelector(".calendar-day").dataset.date'), '2026-11-09')
  await click('.add-to-request')
  await click('.checkout-link')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Новая заявка')
  assert.equal(await evaluate('document.querySelectorAll(".request-equipment").length'), 2)
  assert.equal(
    await evaluate('document.querySelectorAll(".field-error").length'),
    0,
    'Ошибки не должны появляться при открытии',
  )
  await click('.request-actions button[type=submit]')
  assert.equal(await evaluate('document.activeElement.id'), 'request-event')
  assert(
    await evaluate(
      'document.querySelector("#request-event-error").textContent.includes("Выберите мероприятие")',
    ),
  )
  async function fill(selector, value) {
    await evaluate(
      `(() => { const input = document.querySelector(${JSON.stringify(selector)}); const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`,
    )
    await delay(80)
  }
  await fill('#request-event', 'light')
  await fill('#request-location', 'Мастерская цифрового искусства')
  await fill('#request-comment', 'Для показа видео на монтаже и выставке.')
  await fill('#request-start', '')
  await click('.back-link')
  assert(
    await evaluate('Boolean(document.querySelector(".equipment-page"))'),
    'Незаполненные даты в черновике не должны ломать карточку оборудования',
  )
  await click('.checkout-link')
  await fill('#request-start', '2026-11-18')
  for (const width of [1440, 1024, 820, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 940,
      deviceScaleFactor: 1,
      mobile: false,
    })
    assert(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      `Переполнение формы при ${width}px`,
    )
    if (process.argv.includes('--screenshots') && [1440, 390].includes(width)) {
      const layout = await send('Page.getLayoutMetrics')
      const screenshot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height: layout.cssContentSize.height, scale: 1 },
      })
      writeFileSync(
        path.join(tmpdir(), `handoff-new-request-${width}.png`),
        Buffer.from(screenshot.data, 'base64'),
      )
    }
  }
  await fill('#request-end', '2026-11-17')
  await click('.request-actions button[type=submit]')
  assert.equal(await evaluate('document.activeElement.id'), 'request-end')
  assert(
    await evaluate('document.querySelector("#request-end-error").textContent.includes("раньше")'),
  )
  await fill('#request-end', '2026-11-24')
  await click('.request-actions button[type=submit]')
  assert.equal(await evaluate('document.querySelectorAll(".item-unavailable").length'), 2)
  assert.equal(await evaluate('document.activeElement.id'), 'request-equipment-summary')
  await fill('#request-end', '2026-11-20')
  await click('.request-actions a')
  assert.equal(await count(), 4)
  await click('.student-nav a[href="#/requests"]')
  await click('.draft-request-card a')
  assert.equal(
    await evaluate('document.querySelector("#request-comment").value'),
    'Для показа видео на монтаже и выставке.',
  )
  assert.equal(await evaluate('document.querySelector("#request-event").value'), 'light')
  await click('.request-actions button[type=submit]')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Заявка отправлена')
  assert.equal(
    await evaluate('document.querySelector(".request-status").textContent'),
    'На рассмотрении',
  )
  assert.equal(
    await evaluate('document.querySelector(".request-number").textContent'),
    'Заявка № 043',
  )
  assert.equal(await evaluate('document.querySelectorAll(".draft-count").length'), 0)
  async function checkRequestView(name) {
    for (const width of [1440, 1024, 820, 768, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 940,
        deviceScaleFactor: 1,
        mobile: false,
      })
      assert(
        await evaluate('document.documentElement.scrollWidth <= innerWidth'),
        `Переполнение ${name} при ${width}px`,
      )
      if (process.argv.includes('--screenshots') && [1440, 390].includes(width)) {
        const layout = await send('Page.getLayoutMetrics')
        const screenshot = await send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width, height: layout.cssContentSize.height, scale: 1 },
        })
        writeFileSync(
          path.join(tmpdir(), `handoff-${name}-${width}.png`),
          Buffer.from(screenshot.data, 'base64'),
        )
      }
    }
  }
  await checkRequestView('request-sent')
  await click('.request-sent-actions a[href="#/requests"]')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 5)
  assert.equal(
    await evaluate('document.querySelector(".student-request-card .request-number").textContent'),
    'Заявка № 043',
  )
  await checkRequestView('my-requests')
  await click('.student-request-card summary')
  assert(await evaluate('document.querySelector(".student-request-card details").open'))
  assert.equal(
    await evaluate(
      'document.querySelectorAll(".student-request-card:first-child .submitted-equipment li").length',
    ),
    2,
  )
  await click('[data-filter="approved"]')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 1)
  assert.equal(
    await evaluate('document.querySelector(".student-request-card .request-status").textContent'),
    'Можно забирать',
  )
  await fill('.request-list-search input', '043')
  assert(await evaluate('Boolean(document.querySelector(".request-empty"))'))
  await click('.request-empty button')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 5)
  await fill('.request-list-search input', 'HP L1950')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 1)
  await click('[data-filter="issued"]')
  assert.equal(
    await evaluate('document.querySelector(".student-request-card .request-status").textContent'),
    'У вас',
  )
  await fill('.request-list-search input', '')
  await click('[data-filter="pending"]')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 2)
  await click('[data-filter="completed"]')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 1)
  await evaluate('window.location.hash = "/requests/999/sent"')
  await delay(80)
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Заявка не найдена')
  await evaluate('window.location.hash = "/requests/041"')
  await delay(80)
  assert.equal(
    await evaluate('document.querySelector(".request-detail-title .request-status").textContent'),
    'Можно забирать',
  )
  assert.equal(await evaluate('document.querySelectorAll(".request-kit-list li").length'), 2)
  await checkRequestView('request-approved')
  await click('.request-detail-actions > .request-primary')
  assert(await evaluate('document.querySelector("dialog[open]").contains(document.activeElement)'))
  await click('dialog[open] button[type=submit]')
  assert.equal(
    await evaluate('document.querySelector(".request-detail-title .request-status").textContent'),
    'Можно забирать',
    'Нельзя подтвердить получение без сверки комплекта',
  )
  await click('dialog[open] input[type=checkbox]')
  await click('dialog[open] button[type=submit]')
  assert(await evaluate('!document.querySelector("dialog[open]")'))
  assert.equal(
    await evaluate('document.querySelector(".request-detail-title .request-status").textContent'),
    'У вас',
  )
  assert.equal(await evaluate('document.querySelectorAll(".request-history li").length'), 3)
  assert.equal(
    await evaluate('document.querySelector(".request-history h3").textContent'),
    'Вы отметили получение',
  )
  await checkRequestView('request-issued')
  await click('.request-detail-actions > .request-secondary')
  assert.equal(
    await evaluate('document.querySelector("dialog[open]").getAttribute("aria-label")'),
    'Запросить продление',
  )
  await fill('dialog[open] input[name=requestedEnd]', '2026-11-20')
  await click('dialog[open] button[type=submit]')
  assert(await evaluate('Boolean(document.querySelector("dialog[open] .field-error"))'))
  await fill('dialog[open] input[name=requestedEnd]', '2026-11-22')
  await fill('dialog[open] textarea', 'Нужно ещё два дня на монтаж.')
  await click('dialog[open] button[type=submit]')
  assert(await evaluate('!document.querySelector("dialog[open]")'))
  assert(await evaluate('Boolean(document.querySelector(".extension-pending"))'))
  assert(
    await evaluate('document.querySelector("#handover-title").textContent.includes("20 ноября")'),
    'Запрос не должен менять срок до одобрения',
  )
  assert.equal(
    await evaluate(
      'document.querySelectorAll(".request-detail-actions > .request-secondary").length',
    ),
    0,
    'Повторное продление не должно быть доступно',
  )
  await click('.return-equipment-link')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Возврат оборудования')
  assert.equal(
    await evaluate('document.querySelectorAll(".return-equipment-form input:checked").length'),
    0,
    'Отметки возврата не должны быть проставлены заранее',
  )
  await checkRequestView('return-equipment')
  await click('.return-form-actions button')
  assert.equal(await evaluate('document.activeElement.id'), 'return-issue')
  assert(await evaluate('Boolean(document.querySelector(".return-form-error"))'))
  await click('.return-item-checkbox input[value="035"]')
  await click('.return-form-actions button')
  assert(
    await evaluate('Boolean(document.querySelector(".return-form-error"))'),
    'Неполный возврат требует описания',
  )
  await fill('#return-issue', 'Кабель HDMI потерялся при демонтаже.')
  await click('.return-form-actions button')
  assert.equal(
    await evaluate('document.querySelector(".request-detail-title .request-status").textContent'),
    'Возврат на проверке',
  )
  assert.equal(
    await evaluate('document.querySelectorAll(".return-report-items .is-returned").length'),
    1,
  )
  assert.equal(
    await evaluate('document.querySelectorAll(".return-report-items .is-not-returned").length'),
    1,
  )
  assert(
    await evaluate(
      'document.querySelector(".return-reported-issue").textContent.includes("Кабель HDMI потерялся")',
    ),
  )
  assert.equal(await evaluate('document.querySelectorAll(".request-history li").length'), 5)
  assert.equal(
    await evaluate('document.querySelector(".request-history h3").textContent'),
    'Вы отметили возврат',
  )
  await click('.back-link')
  await click('[data-filter="return_pending"]')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 1)
  await click('.open-request-link')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Заявка № 041')
  await evaluate('window.location.hash = "/requests/041/return"')
  await delay(80)
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Возврат уже отмечен')
  assert.equal(await evaluate('document.querySelectorAll(".return-equipment-form").length'), 0)
  await evaluate('window.location.hash = "/requests/040/return"')
  await delay(80)
  await evaluate('document.querySelector(".return-item-checkbox input").focus()')
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: ' ',
    code: 'Space',
    windowsVirtualKeyCode: 32,
  })
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: ' ',
    code: 'Space',
    windowsVirtualKeyCode: 32,
  })
  assert.equal(
    await evaluate('document.querySelector(".return-item-checkbox input").checked'),
    true,
    'Чекбокс должен переключаться пробелом',
  )
  await click('.return-form-actions button')
  assert.equal(
    await evaluate('document.querySelector(".request-detail-title .request-status").textContent'),
    'Возврат на проверке',
  )
  assert.equal(
    await evaluate('document.querySelectorAll(".return-report-items .is-returned").length'),
    1,
  )
  assert.equal(await evaluate('document.querySelectorAll(".return-reported-issue").length'), 0)
  await evaluate('window.location.hash = "/requests/042/return"')
  await delay(80)
  assert.equal(
    await evaluate('document.querySelector("h1").textContent'),
    'Возврат пока недоступен',
  )
  await evaluate('window.location.hash = "/requests/042"')
  await delay(80)
  assert.equal(
    await evaluate(
      'document.querySelectorAll(".request-detail-actions > .request-primary").length',
    ),
    0,
    'Заявку на рассмотрении нельзя получить',
  )
  await click('.request-detail-actions > .request-secondary')
  await click('dialog[open] .dialog-request-actions button[type=button]')
  assert.equal(
    await evaluate('document.querySelector(".request-detail-title .request-status").textContent'),
    'На рассмотрении',
  )
  await click('.request-detail-actions > .request-secondary')
  await click('dialog[open] button[type=submit]')
  assert.equal(
    await evaluate('document.querySelector(".request-detail-title .request-status").textContent'),
    'Отменено',
  )
  assert.equal(
    await evaluate('document.querySelectorAll(".request-detail-actions > button").length'),
    0,
  )
  await evaluate('window.location.hash = "/requests/999"')
  await delay(80)
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Заявка не найдена')
  await evaluate('window.location.hash = "/requests/999/return"')
  await delay(80)
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Заявка не найдена')
  await evaluate('window.location.hash = "/requests/new"')
  await delay(80)
  assert(
    await evaluate(
      'document.querySelector(".request-empty").textContent.includes("Сначала выберите")',
    ),
  )
  await evaluate('window.location.hash = "/equipment/035"')
  await delay(80)
  await click('.add-to-request')
  await click('.checkout-link')
  assert.equal(await evaluate('document.querySelector("#request-comment").value'), '')
  await click('.remove-equipment')
  assert(
    await evaluate('Boolean(document.querySelector(".request-empty"))'),
    'Удаление последнего предмета должно показать пустое состояние',
  )
  await click('.student-nav a[href="#/requests"]')
  assert.equal(
    await evaluate(
      'document.querySelectorAll(".student-request-card:first-child .submitted-equipment li").length',
    ),
    2,
    'Отправленная заявка не должна меняться при редактировании черновика',
  )
  await click('.requests-overview-heading a')
  assert.equal(await count(), 4)
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}/#/equipment/074` })
  for (
    let i = 0;
    i < 100 && !(await evaluate('Boolean(document.querySelector(".equipment-page"))'));
    i++
  ) {
    await delay(100)
  }
  assert(
    await evaluate('document.querySelector(".add-to-request").disabled'),
    'Закрытая техника недоступна',
  )
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}/#/equipment/missing` })
  for (
    let i = 0;
    i < 100 &&
    (await evaluate('document.querySelector("h1")?.textContent')) !== 'Оборудование не найдено';
    i++
  ) {
    await delay(100)
  }
  assert.equal(
    await evaluate('document.querySelector("h1").textContent'),
    'Оборудование не найдено',
  )
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}/` })
  for (
    let i = 0;
    i < 100 && !(await evaluate('Boolean(document.querySelector(".equipment-card"))'));
    i++
  ) {
    await delay(100)
  }
  await click('.date-control')
  assert(
    await evaluate('document.querySelector("dialog[open]").contains(document.activeElement)'),
    'Фокус вне диалога',
  )
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  })
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  })
  await delay(80)
  assert(await evaluate('!document.querySelector("dialog[open]")'), 'Escape не закрыл диалог')
  await click('.date-control')
  assert.equal(
    await evaluate('document.querySelectorAll("dialog[open] input[type=date]").length'),
    2,
  )
  await click('dialog[open] .primary-button')
  assert(await evaluate('!document.querySelector("dialog[open]")'))
  await evaluate('document.activeElement.blur()')
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  })
  assert(await evaluate('document.activeElement !== document.body'), 'Tab не переместил фокус')
  await click('.student-nav a[href="#/events"]')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Мероприятия')
  assert.equal(
    await evaluate('document.querySelector(".student-nav [aria-current=page]").textContent'),
    'Мероприятия',
  )
  assert.equal(await evaluate('document.querySelectorAll(".event-day").length'), 30)
  assert.equal(
    await evaluate('document.querySelectorAll(".event-days > div").length'),
    42,
    'Ноябрь начинается в воскресенье и занимает шесть недель',
  )
  assert.equal(await evaluate('document.querySelectorAll(".event-day.is-selected").length'), 3)
  assert.equal(await evaluate('document.querySelectorAll(".event-bookings li").length'), 2)
  assert(
    await evaluate('!document.querySelector(".event-venue-notice")'),
    'Внутреннему событию не нужна подсказка о внешней площадке',
  )
  for (const width of [1440, 1024, 820, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 940,
      deviceScaleFactor: 1,
      mobile: false,
    })
    assert(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      `Переполнение мероприятий при ${width}px`,
    )
    if (process.argv.includes('--screenshots') && [1440, 390, 320].includes(width)) {
      const layout = await send('Page.getLayoutMetrics')
      const screenshot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height: layout.cssContentSize.height, scale: 1 },
      })
      writeFileSync(
        path.join(tmpdir(), `handoff-events-${width}.png`),
        Buffer.from(screenshot.data, 'base64'),
      )
    }
  }
  await click('.event-agenda li:nth-child(2) button')
  assert.equal(
    await evaluate('document.querySelector("#event-detail-title").textContent'),
    'Защита учебных проектов',
  )
  assert.equal(await evaluate('document.querySelectorAll(".event-day.is-selected").length'), 1)
  assert(
    await evaluate(
      'document.querySelector(".event-bookings").textContent.includes("пока не забронировали")',
    ),
  )
  await evaluate('document.querySelector(".event-agenda li:last-child button").focus()')
  assert(
    await evaluate(
      'document.activeElement === document.querySelector(".event-agenda li:last-child button")',
    ),
    'Кнопка события должна получить фокус',
  )
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Enter',
    code: 'Enter',
    text: '\r',
    windowsVirtualKeyCode: 13,
  })
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
  })
  await delay(80)
  assert.equal(
    await evaluate('document.querySelector("#event-detail-title").textContent'),
    'Выставка цифрового искусства',
  )
  assert(await evaluate('Boolean(document.querySelector(".event-venue-notice"))'))
  assert.equal(
    await evaluate('document.querySelectorAll(".event-day.is-selected").length'),
    3,
    'Многодневное событие пересекает границу недели',
  )
  await click('.event-month-controls button:last-child')
  assert(
    await evaluate('document.querySelector("#event-month").textContent.includes("декабрь 2026")'),
  )
  assert(
    await evaluate('Boolean(document.querySelector(".event-detail-empty"))'),
    'В пустом месяце не должна оставаться карточка прошлого события',
  )
  await click('.event-month-controls button:last-child')
  assert(
    await evaluate('document.querySelector("#event-month").textContent.includes("январь 2027")'),
  )
  await click('.event-month-controls button:first-child')
  await click('.event-month-controls button:first-child')
  await click('.event-days button[aria-label="19 ноября: Показ «Световая среда»"]')
  assert.equal(
    await evaluate('document.querySelector("#event-detail-title").textContent'),
    'Показ «Световая среда»',
    'Событие выбирается и по дню продолжения',
  )
  await click('.event-agenda li:last-child button')
  await click('.event-choose')
  assert(await evaluate('Boolean(document.querySelector(".catalog-event-context"))'))
  assert(
    await evaluate('document.querySelector(".date-control").textContent.includes("28–30 ноября")'),
  )
  await click('.details-link')
  assert.equal(
    await evaluate('document.querySelector(".booking-summary dd").textContent'),
    '28–30 ноября',
  )
  await click('.add-to-request')
  await click('.checkout-link')
  assert.equal(await evaluate('document.querySelector("#request-event").value'), 'exhibition')
  assert.equal(await evaluate('document.querySelector("#request-start").value'), '2026-11-28')
  assert.equal(await evaluate('document.querySelector("#request-end").value'), '2026-11-30')
  assert.equal(
    await evaluate('document.querySelector("#request-location").value'),
    'Внешняя площадка',
  )
  await click('.notification-button')
  assert(
    await evaluate('document.querySelector(".notification-popover").matches(":popover-open")'),
    'Колокольчик открывает карточку',
  )
  assert(
    await evaluate('location.hash.startsWith("#/requests/new")'),
    'Карточка не переключает страницу',
  )
  for (const width of [1440, 1024, 820, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 940,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await delay(50)
    assert(
      await evaluate(
        '(() => { const r = document.querySelector(".notification-popover").getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight })()',
      ),
      `Карточка вне экрана ${width}px`,
    )
    if (process.argv.includes('--screenshots') && [1440, 390].includes(width)) {
      const screenshot = await send('Page.captureScreenshot', { format: 'png' })
      writeFileSync(
        path.join(tmpdir(), `handoff-notification-popover-${width}.png`),
        Buffer.from(screenshot.data, 'base64'),
      )
    }
  }
  await click('.notification-button')
  assert(
    await evaluate('!document.querySelector(".notification-popover").matches(":popover-open")'),
    'Повторное нажатие закрывает карточку',
  )
  await evaluate('document.querySelector(".notification-button").focus()')
  await click('.notification-button')
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  })
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  })
  assert(
    await evaluate(
      'document.querySelector(".notification-popover").contains(document.activeElement)',
    ),
    'Tab переводит фокус внутрь карточки',
  )
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  })
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  })
  await delay(80)
  assert(
    await evaluate('!document.querySelector(".notification-popover").matches(":popover-open")'),
    'Escape закрывает карточку',
  )
  assert(
    await evaluate('document.activeElement === document.querySelector(".notification-button")'),
    'Escape возвращает фокус к колокольчику',
  )
  await click('.notification-button')
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: 5,
    y: 250,
    button: 'left',
    clickCount: 1,
  })
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: 5,
    y: 250,
    button: 'left',
    clickCount: 1,
  })
  await delay(80)
  assert(
    await evaluate('!document.querySelector(".notification-popover").matches(":popover-open")'),
    'Нажатие снаружи закрывает карточку',
  )
  await click('.notification-button')
  await click('.notification-popover-all')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Уведомления')
  assert.equal(await evaluate('document.querySelectorAll(".notification-row").length'), 3)
  assert.equal(await evaluate('document.querySelectorAll(".notification-row.is-unread").length'), 2)
  assert.equal(await evaluate('document.querySelector(".notification-count").textContent'), '2')
  assert(
    await evaluate('!document.querySelector(".student-nav [aria-current]")'),
    'На странице уведомлений основные разделы не активны',
  )
  for (const route of ['#/notifications', '#/profile']) {
    await evaluate(`location.hash = ${JSON.stringify(route)}`)
    await delay(80)
    for (const width of [1440, 1024, 820, 768, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 940,
        deviceScaleFactor: 1,
        mobile: false,
      })
      assert(
        await evaluate('document.documentElement.scrollWidth <= innerWidth'),
        `Переполнение ${route} при ${width}px`,
      )
      if (process.argv.includes('--screenshots') && [1440, 390].includes(width)) {
        const layout = await send('Page.getLayoutMetrics')
        const screenshot = await send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width, height: layout.cssContentSize.height, scale: 1 },
        })
        writeFileSync(
          path.join(tmpdir(), `handoff-${route.slice(2)}-${width}.png`),
          Buffer.from(screenshot.data, 'base64'),
        )
      }
    }
  }
  assert.equal(
    await evaluate('document.querySelector(".profile-details dd").textContent'),
    'anna@example.org',
  )
  assert.equal(
    await evaluate('document.querySelector("#profile-name").textContent'),
    await evaluate('document.querySelector(".account-text strong").textContent'),
  )
  await click('.notification-button')
  await click('.notification-popover-all')
  await click('.notification-filters button:last-child')
  assert.equal(await evaluate('document.querySelectorAll(".notification-row").length'), 2)
  await click('.notification-link')
  assert(
    await evaluate('location.hash === "#/requests/040"'),
    'Напоминание ведёт к выданной заявке',
  )
  assert.equal(await evaluate('document.querySelector(".notification-count").textContent'), '1')
  await click('.notification-button')
  assert.equal(
    await evaluate('document.querySelectorAll(".notification-popover-list .is-unread").length'),
    1,
  )
  await click('.notification-popover-read')
  assert(
    await evaluate('!document.querySelector(".notification-count")'),
    'Прочитать все в карточке обновляет счётчик',
  )
  await click('.notification-popover-all')
  await click('.notification-filters button:last-child')
  assert.equal(await evaluate('document.querySelectorAll(".notification-row").length'), 0)
  assert(await evaluate('Boolean(document.querySelector(".account-empty"))'))
  assert(await evaluate('!document.querySelector(".notification-count")'))
  await click('.notification-filters button:first-child')
  assert.equal(
    await evaluate('document.querySelectorAll(".notification-row").length'),
    3,
    'Прочтение не удаляет уведомления',
  )
  await click('.account-button')
  for (const route of ['#/requests', '#/events', '#/notifications', '#/profile']) {
    await evaluate(`location.hash = ${JSON.stringify(route)}`)
    await delay(80)
    const title = await evaluate('document.querySelector("main h1").textContent')
    await click('.skip-link')
    assert.equal(
      await evaluate('location.hash'),
      route,
      'Ссылка к содержимому не должна менять страницу',
    )
    assert.equal(await evaluate('document.querySelector("main h1").textContent'), title)
    assert(
      await evaluate('document.activeElement.id === "main"'),
      'Ссылка к содержимому должна переводить фокус в main',
    )
  }
  await click('.profile-actions > button:first-child')
  assert(
    await evaluate('document.querySelector("dialog[open]").contains(document.activeElement)'),
    'Фокус внутри смены пароля',
  )
  assert.equal(
    await evaluate('document.querySelectorAll("dialog[open] .account-error").length'),
    0,
    'Ошибок до отправки нет',
  )
  await click('dialog[open] .password-form button[type=submit]')
  assert.equal(await evaluate('document.activeElement.id'), 'password-current')
  assert.equal(await evaluate('document.querySelectorAll("dialog[open] .account-error").length'), 3)
  async function fillPassword(name, value) {
    await evaluate(
      `document.querySelector('#password-${name}').value = ${JSON.stringify(value)}; document.querySelector('#password-${name}').dispatchEvent(new Event('input', { bubbles: true }))`,
    )
    await delay(80)
  }
  await fillPassword('current', 'demo-old-value')
  await fillPassword('password', 'short')
  await fillPassword('confirm', 'short')
  await click('dialog[open] .password-form button[type=submit]')
  assert.equal(await evaluate('document.activeElement.id'), 'password-password')
  await fillPassword('password', 'demo-new-value')
  await fillPassword('confirm', 'different-value')
  await click('dialog[open] .password-form button[type=submit]')
  assert.equal(await evaluate('document.activeElement.id'), 'password-confirm')
  await fillPassword('confirm', 'demo-new-value')
  await click('dialog[open] .password-visibility')
  assert.equal(await evaluate('document.querySelector("#password-password").type'), 'text')
  await click('dialog[open] .password-form button[type=submit]')
  assert(
    await evaluate(
      'document.querySelector(".password-notice").textContent.includes("пароль не меняется")',
    ),
    'Демоформа не сообщает об успешной смене пароля',
  )
  assert.equal(
    await evaluate('document.querySelector("#password-password").value'),
    '',
    'Пароли очищаются после проверки',
  )
  await fillPassword('current', 'demo-do-not-retain')
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  })
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  })
  await delay(80)
  assert(await evaluate('!document.querySelector("dialog[open]")'))
  assert(
    await evaluate(
      'document.activeElement === document.querySelector(".profile-actions > button:first-child")',
    ),
    'После Escape фокус возвращается к кнопке',
  )
  await click('.profile-actions > button:first-child')
  assert.equal(
    await evaluate('document.querySelector("#password-current").value'),
    '',
    'Закрытие очищает пароли',
  )
  assert.equal(await evaluate('document.querySelectorAll("dialog[open] .account-error").length'), 0)
  await click('dialog[open] .modal-header button')
  await click('.profile-logout')
  await click('dialog[open] .account-secondary')
  assert(await evaluate('!document.querySelector("dialog[open]")'))
  assert(
    await evaluate('Boolean(document.querySelector(".profile-panel"))'),
    'Отмена выхода оставляет профиль',
  )
  await click('.profile-logout')
  await click('dialog[open] .account-primary')
  assert(await evaluate('Boolean(document.querySelector(".demo-session-ended"))'))
  assert(
    await evaluate('!document.querySelector(".student-header")'),
    'После выхода рабочие разделы скрыты',
  )
  await click('.demo-session-ended button')
  assert.equal(await count(), 4)
  assert(
    await evaluate('!document.querySelector(".draft-count")'),
    'Новый демосеанс очищает черновик',
  )
  assert.equal(
    await evaluate('document.querySelector(".notification-count").textContent'),
    '2',
    'Новый демосеанс восстанавливает исходные уведомления',
  )
  await evaluate('location.hash = "#/requests/040/return"')
  await delay(80)
  await evaluate('document.querySelector(".return-item-checkbox input").click()')
  await delay(80)
  await click('.return-form-actions button')
  await click('.notification-button')
  await click('.notification-popover-all')
  assert.equal(
    await evaluate('document.querySelectorAll(".notification-row").length'),
    2,
    'После отметки возврата напоминание больше не нужно',
  )
  // Проверяем ту же карточку при отсутствии нативного Popover API.
  await send('Page.enable')
  const fallbackScript = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: 'delete HTMLElement.prototype.popover; window.__popoverFallbackTest = true',
  })
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}/` })
  for (
    let i = 0;
    i < 100 &&
    !(await evaluate(
      'Boolean(window.__popoverFallbackTest && document.querySelector(".notification-button"))',
    ));
    i++
  ) {
    await delay(100)
  }
  assert(
    await evaluate('!("popover" in HTMLElement.prototype)'),
    JSON.stringify(
      await evaluate(
        '({ fallbackScriptRan: window.__popoverFallbackTest, descriptor: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "popover") })',
      ),
    ),
  )
  await click('.notification-button')
  assert(
    await evaluate('!document.querySelector(".notification-popover").hidden'),
    'Резервная карточка открывается без Popover API',
  )
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  })
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  })
  await delay(80)
  assert(
    await evaluate('document.querySelector(".notification-popover").hidden'),
    'Резервная карточка закрывается по Escape',
  )
  await click('.notification-button')
  await click('.notification-popover-list a')
  assert(await evaluate('location.hash === "#/requests/040"'))
  assert.equal(await evaluate('document.querySelector(".notification-count").textContent'), '1')
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: fallbackScript.identifier })
  assert.deepEqual(runtimeErrors, [], 'Ошибки JavaScript в браузере')
  console.log(
    'PASS: 11 экранов на 6 размерах; уведомления, прочтение, актуальность напоминаний, профиль, валидация и очистка паролей, выход и сброс демосеанса; каталог, мероприятия и заявки',
  )
} finally {
  socket?.close()
  if (process.platform === 'win32') {
    await new Promise((resolve) =>
      spawn('taskkill', ['/PID', String(browser.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      }).on('exit', resolve),
    )
  } else {
    browser.kill()
  }
  server.close()
}
