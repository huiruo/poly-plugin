import { ACTIONS, BACKGROUND_EVENTS } from '~/common/action'

const SELECTOR = 'input[placeholder="0"][inputmode="decimal"]'

function getInputEl(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(SELECTOR)
}

function getValue() {
  return getInputEl()?.value ?? ''
}

// 在输入变化时主动通知扩展（popup 也能通过 sendMessage 主动拉取）
function notifyValue() {
  const value = getValue()
  chrome.runtime.sendMessage({
    type: BACKGROUND_EVENTS.GetPageContent,
    payload: { value },
  })
}

// 立刻发送一次当前值并监听后续变化
const inputEl = getInputEl()
if (inputEl) {
  notifyValue()
  inputEl.addEventListener('input', () => {
    notifyValue()
  })
}

// 响应 popup 主动请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === ACTIONS.QueryInput) {
    sendResponse({ value: getValue() })
    return true
  }
})