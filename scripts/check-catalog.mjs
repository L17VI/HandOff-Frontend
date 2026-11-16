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
const chromePath = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
].find((file) => file && existsSync(file))
assert(chromePath, 'Chrome/Edge не найден. Укажите CHROME_PATH')
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); res.end(); return }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
  res.end(readFileSync(file))
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const profile = mkdtempSync(path.join(tmpdir(), 'handoff-check-'))
const browser = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
let socket
try {
  const portFile = path.join(profile, 'DevToolsActivePort')
  for (let i = 0; !existsSync(portFile) && i < 100; i++) await delay(100)
  const port = readFileSync(portFile, 'utf8').split('\n')[0]
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  let id = 0
  const pending = new Map()
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id) }
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
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const click = async (selector) => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await delay(80) }
  const count = () => evaluate('document.querySelectorAll(".equipment-card").length')
  const address = server.address()
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}` })
  for (let i = 0; i < 100 && !(await evaluate('Boolean(document.querySelector(".equipment-card"))')); i++) await delay(100)
  assert.equal(await count(), 4)
  for (const width of [1440, 1024, 820, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Переполнение при ${width}px`)
    assert(await evaluate('[...document.querySelectorAll(".equipment-media img")].every(i => i.complete && i.naturalWidth > 0)'), 'Изображения не загружены')
  }
  await click('.category-button:nth-child(2)')
  assert.equal(await count(), 2)
  await click('.category-button:nth-child(5)')
  assert.equal(await count(), 0)
  assert(await evaluate('Boolean(document.querySelector(".catalog-empty"))'))
  await click('.clear-button')
  await evaluate(`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(document.querySelector('input[type=search]'), 'hdmi'); document.querySelector('input[type=search]').dispatchEvent(new Event('input', { bubbles: true }))`)
  await delay(80)
  assert.equal(await count(), 3)
  await click('.clear-button')
  await evaluate(`document.querySelector('.select-control select').value = 'Б'; document.querySelector('.select-control select').dispatchEvent(new Event('change', { bubbles: true }))`)
  await delay(80)
  assert.equal(await count(), 1)
  await click('.clear-button')
  await evaluate(`document.querySelector('.sort-control select').value = 'name'; document.querySelector('.sort-control select').dispatchEvent(new Event('change', { bubbles: true }))`)
  await delay(80)
  assert.equal(await evaluate('document.querySelector(".equipment-card h3").textContent'), 'Кабель HDMI')
  await click('.clear-button')
  await click('.details-link')
  assert(await evaluate('Boolean(document.querySelector(".equipment-page"))'), 'Карточка не открылась')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Проектор Epson EB-X24')
  assert.equal(await evaluate('document.querySelectorAll(".calendar-day.is-selected").length'), 3)
  assert.equal(await evaluate('document.querySelector(".booking-summary dd").textContent'), '18–20 ноября')
  for (const width of [1440, 1024, 820, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 940, deviceScaleFactor: 1, mobile: false })
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Переполнение карточки при ${width}px`)
    if (process.argv.includes('--screenshots') && [1440, 390].includes(width)) {
      const layout = await send('Page.getLayoutMetrics')
      const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: layout.cssContentSize.height, scale: 1 } })
      writeFileSync(path.join(tmpdir(), `handoff-equipment-${width}.png`), Buffer.from(screenshot.data, 'base64'))
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
  assert(await evaluate('document.querySelector(".add-to-request").disabled'), 'Нельзя бронировать период с занятыми днями внутри')
  assert.equal(await evaluate('document.querySelector(".availability-badge").textContent'), 'Занято на эти даты')
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
  assert.equal(await evaluate('document.querySelectorAll(".field-error").length'), 0, 'Ошибки не должны появляться при открытии')
  await click('.request-actions button[type=submit]')
  assert.equal(await evaluate('document.activeElement.id'), 'request-event')
  assert(await evaluate('document.querySelector("#request-event-error").textContent.includes("Выберите мероприятие")'))
  async function fill(selector, value) {
    await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`)
    await delay(80)
  }
  await fill('#request-event', 'light')
  await fill('#request-location', 'Мастерская цифрового искусства')
  await fill('#request-comment', 'Для показа видео на монтаже и выставке.')
  await fill('#request-start', '')
  await click('.back-link')
  assert(await evaluate('Boolean(document.querySelector(".equipment-page"))'), 'Незаполненные даты в черновике не должны ломать карточку оборудования')
  await click('.checkout-link')
  await fill('#request-start', '2026-11-18')
  for (const width of [1440, 1024, 820, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 940, deviceScaleFactor: 1, mobile: false })
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Переполнение формы при ${width}px`)
    if (process.argv.includes('--screenshots') && [1440, 390].includes(width)) {
      const layout = await send('Page.getLayoutMetrics')
      const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: layout.cssContentSize.height, scale: 1 } })
      writeFileSync(path.join(tmpdir(), `handoff-new-request-${width}.png`), Buffer.from(screenshot.data, 'base64'))
    }
  }
  await fill('#request-end', '2026-11-17')
  await click('.request-actions button[type=submit]')
  assert.equal(await evaluate('document.activeElement.id'), 'request-end')
  assert(await evaluate('document.querySelector("#request-end-error").textContent.includes("раньше")'))
  await fill('#request-end', '2026-11-24')
  await click('.request-actions button[type=submit]')
  assert.equal(await evaluate('document.querySelectorAll(".item-unavailable").length'), 2)
  assert.equal(await evaluate('document.activeElement.id'), 'request-equipment-summary')
  await fill('#request-end', '2026-11-20')
  await click('.request-actions a')
  assert.equal(await count(), 4)
  await click('.student-nav a[href="#/requests"]')
  await click('.draft-request-card a')
  assert.equal(await evaluate('document.querySelector("#request-comment").value'), 'Для показа видео на монтаже и выставке.')
  assert.equal(await evaluate('document.querySelector("#request-event").value'), 'light')
  await click('.request-actions button[type=submit]')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Заявка отправлена')
  assert.equal(await evaluate('document.querySelector(".request-status").textContent'), 'На рассмотрении')
  assert.equal(await evaluate('document.querySelector(".request-number").textContent'), 'Заявка № 043')
  assert.equal(await evaluate('document.querySelectorAll(".draft-count").length'), 0)
  async function checkRequestView(name) {
    for (const width of [1440, 1024, 820, 768, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 940, deviceScaleFactor: 1, mobile: false })
      assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Переполнение ${name} при ${width}px`)
      if (process.argv.includes('--screenshots') && [1440, 390].includes(width)) {
        const layout = await send('Page.getLayoutMetrics')
        const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: layout.cssContentSize.height, scale: 1 } })
        writeFileSync(path.join(tmpdir(), `handoff-${name}-${width}.png`), Buffer.from(screenshot.data, 'base64'))
      }
    }
  }
  await checkRequestView('request-sent')
  await click('.request-sent-actions a[href="#/requests"]')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 5)
  assert.equal(await evaluate('document.querySelector(".student-request-card .request-number").textContent'), 'Заявка № 043')
  await checkRequestView('my-requests')
  await click('.student-request-card summary')
  assert(await evaluate('document.querySelector(".student-request-card details").open'))
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card:first-child .submitted-equipment li").length'), 2)
  await click('[data-filter="approved"]')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 1)
  assert.equal(await evaluate('document.querySelector(".student-request-card .request-status").textContent'), 'Можно забирать')
  await fill('.request-list-search input', '043')
  assert(await evaluate('Boolean(document.querySelector(".request-empty"))'))
  await click('.request-empty button')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 5)
  await fill('.request-list-search input', 'HP L1950')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 1)
  await click('[data-filter="issued"]')
  assert.equal(await evaluate('document.querySelector(".student-request-card .request-status").textContent'), 'У вас')
  await fill('.request-list-search input', '')
  await click('[data-filter="pending"]')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 2)
  await click('[data-filter="completed"]')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card").length'), 1)
  await evaluate('window.location.hash = "/requests/999/sent"')
  await delay(80)
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Заявка не найдена')
  await evaluate('window.location.hash = "/requests/new"')
  await delay(80)
  assert(await evaluate('document.querySelector(".request-empty").textContent.includes("Сначала выберите")'))
  await evaluate('window.location.hash = "/equipment/035"')
  await delay(80)
  await click('.add-to-request')
  await click('.checkout-link')
  assert.equal(await evaluate('document.querySelector("#request-comment").value'), '')
  await click('.remove-equipment')
  assert(await evaluate('Boolean(document.querySelector(".request-empty"))'), 'Удаление последнего предмета должно показать пустое состояние')
  await click('.student-nav a[href="#/requests"]')
  assert.equal(await evaluate('document.querySelectorAll(".student-request-card:first-child .submitted-equipment li").length'), 2, 'Отправленная заявка не должна меняться при редактировании черновика')
  await click('.requests-overview-heading a')
  assert.equal(await count(), 4)
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}/#/equipment/074` })
  for (let i = 0; i < 100 && !(await evaluate('Boolean(document.querySelector(".equipment-page"))')); i++) await delay(100)
  assert(await evaluate('document.querySelector(".add-to-request").disabled'), 'Закрытая техника недоступна')
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}/#/equipment/missing` })
  for (let i = 0; i < 100 && (await evaluate('document.querySelector("h1")?.textContent')) !== 'Оборудование не найдено'; i++) await delay(100)
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Оборудование не найдено')
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}/` })
  for (let i = 0; i < 100 && !(await evaluate('Boolean(document.querySelector(".equipment-card"))')); i++) await delay(100)
  await click('.notification-button')
  assert(await evaluate('document.querySelector("dialog[open]").contains(document.activeElement)'), 'Фокус вне диалога')
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await delay(80)
  assert(await evaluate('!document.querySelector("dialog[open]")'), 'Escape не закрыл диалог')
  await click('.date-control')
  assert.equal(await evaluate('document.querySelectorAll("dialog[open] input[type=date]").length'), 2)
  await click('dialog[open] .primary-button')
  assert(await evaluate('!document.querySelector("dialog[open]")'))
  await evaluate('document.activeElement.blur()')
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  assert(await evaluate('document.activeElement !== document.body'), 'Tab не переместил фокус')
  console.log('PASS: 5 экранов на 6 размерах; оформление, подтверждение, уникальный номер, список и статусы, поиск, фильтры, раскрытие состава, неизвестная заявка, сохранение черновика, валидация, диалоги и клавиатура')
} finally {
  socket?.close()
  if (process.platform === 'win32') {
    await new Promise((resolve) => spawn('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }).on('exit', resolve))
  } else browser.kill()
  server.close()
}
