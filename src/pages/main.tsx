import { useEffect, useState } from 'react'

import { ACTIONS, BACKGROUND_EVENTS } from '~/common/action'
import type { MsgRes, TabInfo } from '~/common/types'
import styles from '~/components/popup/main.module.css'
import { StartSelectEnum } from '~/components/content/helper'

export function Main() {
  const [tab, setTab] = useState<TabInfo>(null)
  const [inputValue, setInputValue] = useState<string>('')

  const getCurrentTab = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })

    setTab(tab as TabInfo)
    return tab as TabInfo
  }

  // 向 content script 请求当前 input 值（也会接收 content 主动推送）
  const fetchInputValue = async (tabId?: number) => {
    try {
      const id = tabId ?? tab?.id
      if (!id) return
      const res = await chrome.tabs.sendMessage(id, { type: ACTIONS.QueryInput })
      if (res?.value != null) {
        setInputValue(String(res.value))
      }
    } catch (err) {
      console.warn('fetchInputValue failed', err)
    }
  }

  const onClipEntirePage = async () => {
    try {
      if (tab) {
        const data = await chrome.runtime.sendMessage({
          type: BACKGROUND_EVENTS.QueryTab,
          payload: tab,
        })

        console.log('popup.tsx onClipEntirePage-res', data)
      } else {
        console.warn('popup.tsx No tab information')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const initTabsListener = () => {
    chrome.runtime.onMessage.addListener(
      (request: MsgRes<keyof typeof ACTIONS | keyof typeof BACKGROUND_EVENTS, any>, sender, sendResponse) => {
        console.log('%c=popup.tsx add Listener:', 'color:gold', request)

        switch (request.type) {
          case BACKGROUND_EVENTS.TabNotComplete:
            // Todo
            console.log(
              '%c=popup.tsx-add Listener TabNotComplete:',
              'color: gold',
            )
            break
          case BACKGROUND_EVENTS.GetPageContent:
            console.log(
              '%c=popup.tsx-add Listener GetPageContent:',
              'color: gold',
            )
            // update UI with incoming value from content script
            if (request.payload?.value != null) {
              setInputValue(String(request.payload.value))
            }
            return true
          default:
            // Handle other cases here
            break
        }

        return true
      },
    )
  }

  const onEnterManually = async () => {
    window.close()
    await chrome.tabs.sendMessage(tab.id, {
      type: ACTIONS.EnterManually,
      payload: {},
    })
  }

  const onAreaSelect = async (action: StartSelectEnum) => {
    window.close()
    await chrome.tabs.sendMessage(tab.id, {
      type: ACTIONS.AreaSelect,
      payload: {
        action,
      },
    })
  }

  const onSubmit = () => {
    console.log('onsubmit')
  }

  useEffect(() => {
    const init = async () => {
      initTabsListener()
      const current = await getCurrentTab()
      if (current?.id) {
        await fetchInputValue(current.id)
      }
    }
    init()
  }, [])

  return (
    <div className={styles.container}>
      {/* 显示从页面获取到的 input 值 */}
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Input value: {inputValue ?? '-'}</div>

      <ul className={styles.ul}>
        <li
          className={styles.item}
          onClick={() => onAreaSelect(StartSelectEnum.areaSelect)}>
          Delete elements
        </li>

        <li
          className={styles.item}
          onClick={() => onAreaSelect(StartSelectEnum.screenShot)}>
          Area screenshots
        </li>
      </ul>
    </div>
  )
}

export default Main