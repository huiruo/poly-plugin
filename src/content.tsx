import styles from 'data-text:./components/content/content.module.css'
import type { PlasmoCSConfig } from 'plasmo'
import { useEffect, useState } from 'react'
import TurndownService from 'turndown'

import { ACTIONS, BACKGROUND_EVENTS } from '~/common/action'
import { prepareContent } from '~/common/prepare-content'
import type { MsgRes } from '~/common/types'

import { DraggableBox } from './components/content/draggableBox'
import { StartSelectEnum } from './components/content/helper'
import { initSelectArea } from './components/content/selector'

export const getStyle = () => {
  const style = document.createElement('style')
  style.textContent = styles

  return style
}

export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
}

const PlasmoOverlay = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')

  // 立即检查页面上的输入框
  console.log('🚀 Content script loaded, checking for inputs immediately...')
  console.log('Current URL:', window.location.href)
  console.log('🔧 Plugin is working!')
  
  // 立即执行一次检查
  setTimeout(() => {
    console.log('🔍 Immediate check after 1 second...')
    const allInputs = document.querySelectorAll('input')
    console.log(`Found ${allInputs.length} total inputs on page`)
    
    allInputs.forEach((input, index) => {
      const htmlInput = input as HTMLInputElement
      console.log(`Input ${index}:`, {
        tagName: htmlInput.tagName,
        type: htmlInput.type,
        className: htmlInput.className,
        value: htmlInput.value,
        placeholder: htmlInput.placeholder,
        inputmode: htmlInput.inputMode,
        autocomplete: htmlInput.autocomplete,
        outerHTML: htmlInput.outerHTML.substring(0, 200) + '...'
      })
    })
  }, 1000)

  // 监听 Polymarket 输入框值变化
  /*
  useEffect(() => {
    const handleInputChange = (event: Event) => {
      const target = event.target as HTMLInputElement
      console.log('Input event detected:', target, target.className, target.value)
      
      // 更宽泛的选择器匹配
      if (target && target.matches('input[inputmode="decimal"]')) {
        const value = target.value
        setInputValue(value)
        console.log('Polymarket input value changed:', value)
        
        // 主动发送给 popup
        chrome.runtime.sendMessage({
          type: BACKGROUND_EVENTS.GetPageContent,
          payload: { value }
        }).catch(err => console.warn('Failed to send input value to popup:', err))
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const target = event.target as HTMLInputElement
      console.log('Keyup event detected:', target, target.className, target.value)
      
      if (target && target.matches('input[inputmode="decimal"]')) {
        const value = target.value
        setInputValue(value)
        console.log('Polymarket input value changed (keyup):', value)
        
        chrome.runtime.sendMessage({
          type: BACKGROUND_EVENTS.GetPageContent,
          payload: { value }
        }).catch(err => console.warn('Failed to send input value to popup:', err))
      }
    }

    // 监听所有输入事件
    document.addEventListener('input', handleInputChange)
    document.addEventListener('change', handleInputChange)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('keydown', handleKeyUp)

    // 定期检查输入框值（处理动态内容）
    const checkInputs = () => {
      console.log('=== 开始检查输入框 ===')
      
      // 尝试多种选择器
      const selectors = [
        'input[inputmode="decimal"]',
        'input[type="text"][inputmode="decimal"]',
        'input.c-fPFMNh', // 根据你提供的class
        'input[placeholder="0"]',
        'input[autocomplete="off"][inputmode="decimal"]',
        'input[type="text"]', // 所有文本输入框
        'input' // 所有输入框
      ]
      
      // 检查每个选择器
      selectors.forEach(selector => {
        const inputs = document.querySelectorAll(selector)
        console.log(`🔍 Selector "${selector}" found ${inputs.length} inputs`)
        
        if (inputs.length > 0) {
          inputs.forEach((input, index) => {
            const htmlInput = input as HTMLInputElement
            console.log(`  📝 Input ${index} (${selector}):`, {
              element: htmlInput,
              outerHTML: htmlInput.outerHTML,
              value: htmlInput.value,
              className: htmlInput.className,
              placeholder: htmlInput.placeholder,
              inputmode: htmlInput.inputMode,
              type: htmlInput.type,
              autocomplete: htmlInput.autocomplete,
              style: htmlInput.style.cssText,
              parentElement: htmlInput.parentElement?.outerHTML,
              isVisible: htmlInput.offsetWidth > 0 && htmlInput.offsetHeight > 0,
              isDisabled: htmlInput.disabled,
              isReadOnly: htmlInput.readOnly
            })
          })
        }
      })
      
      // 获取所有输入框
      const allInputs: NodeListOf<HTMLInputElement> = document.querySelectorAll('input')
      console.log(`📊 Total inputs found: ${allInputs.length}`)
      
      // 详细检查每个输入框
      allInputs.forEach((input, index) => {
        const htmlInput = input as HTMLInputElement
        console.log(`🔍 Input ${index} 详细信息:`, {
          element: htmlInput,
          outerHTML: htmlInput.outerHTML,
          value: htmlInput.value,
          className: htmlInput.className,
          placeholder: htmlInput.placeholder,
          inputmode: htmlInput.inputMode,
          type: htmlInput.type,
          autocomplete: htmlInput.autocomplete,
          style: htmlInput.style.cssText,
          parentElement: htmlInput.parentElement?.outerHTML,
          grandParentElement: htmlInput.parentElement?.parentElement?.outerHTML,
          isVisible: htmlInput.offsetWidth > 0 && htmlInput.offsetHeight > 0,
          isDisabled: htmlInput.disabled,
          isReadOnly: htmlInput.readOnly,
          computedStyle: window.getComputedStyle(htmlInput),
          boundingRect: htmlInput.getBoundingClientRect()
        })
        
        // 检查是否是Polymarket的输入框
        const isPolymarketInput = htmlInput.matches('input[inputmode="decimal"]') ||
                                 htmlInput.className.includes('c-fPFMNh') ||
                                 (htmlInput.placeholder === '0' && htmlInput.type === 'text') ||
                                 htmlInput.className.includes('c-fPFMNh')
        
        console.log(`🎯 Input ${index} 是否匹配Polymarket: ${isPolymarketInput}`)
        
        if (isPolymarketInput) {
          console.log(`✅ 找到Polymarket输入框! 值: "${htmlInput.value}"`)
          
          if (htmlInput.value && htmlInput.value !== inputValue) {
            setInputValue(htmlInput.value)
            console.log('🔄 更新输入值:', htmlInput.value)
            
            chrome.runtime.sendMessage({
              type: BACKGROUND_EVENTS.GetPageContent,
              payload: { value: htmlInput.value }
            }).catch(err => console.warn('Failed to send input value to popup:', err))
          }
        }
      })
      
      console.log('=== 检查完成 ===')
    }

    // 立即检查一次
    checkInputs()
    
    // 每2秒检查一次
    const interval = setInterval(checkInputs, 2000) as NodeJS.Timeout
    
    // 将检查函数暴露到全局，方便手动调试
    ;(window as any).debugPolymarketInputs = checkInputs
    
    // 添加一个简单的测试函数
    ;(window as any).testInputs = () => {
      console.log('🧪 简单测试函数')
      const inputs = document.querySelectorAll('input')
      console.log(`找到 ${inputs.length} 个输入框`)
      
      inputs.forEach((input, i) => {
        const inp = input as HTMLInputElement
        console.log(`输入框 ${i}:`, {
          value: inp.value,
          class: inp.className,
          type: inp.type,
          placeholder: inp.placeholder,
          inputmode: inp.inputMode
        })
      })
    }
    
    console.log('🔧 调试函数已暴露:')
    console.log('  - window.debugPolymarketInputs() - 详细检查')
    console.log('  - window.testInputs() - 简单测试')

    return () => {
      document.removeEventListener('input', handleInputChange)
      document.removeEventListener('change', handleInputChange)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('keydown', handleKeyUp)
      clearInterval(interval)
    }
  }, [inputValue])
  */

  useEffect(() => {
    chrome.runtime.onMessage.addListener(
      (
        request: MsgRes<keyof typeof BACKGROUND_EVENTS | keyof typeof ACTIONS, any>,
        sender,
        sendResponse,
      ) => {
        console.log('%c=contentjs onMessage:', 'color:red', request)
        if (request.type === BACKGROUND_EVENTS.GetPageContent) {
          prepareContent()
            .then((document) => {
              sendResponse({ document })
            })
            .catch((error) => {
              console.log('prepare error', error)
            })
        } else if (request.type === BACKGROUND_EVENTS.EndOfGetPageContent) {
          const turndownService = new TurndownService()

          const markdownContent = turndownService.turndown(
            request.payload.content,
          )

          console.log(
            '%c=contentjs onMessage EndOfGetPageContent parse markdownwn results:',
            'color:yellow',
            { markdownContent },
          )
        } else if (request.type === ACTIONS.EnterManually) {
          setIsOpen(true)
        } else if (request.type === ACTIONS.AreaSelect) {
          initSelectArea({ type: request.payload.action as StartSelectEnum })
        } else if (request.type === ACTIONS.QueryInput) {
          // 处理 popup 的查询请求
          console.log('🔍 收到 QUERY_INPUT 请求，开始检查DOM...')
          
          // 立即检查所有输入框
          const allInputs = document.querySelectorAll('input')
          console.log(`📊 找到 ${allInputs.length} 个输入框`)
          
          let foundValue = inputValue // 默认使用当前状态值
          
          allInputs.forEach((input, index) => {
            const htmlInput = input as HTMLInputElement
            console.log(`🔍 检查输入框 ${index}:`, {
              value: htmlInput.value,
              className: htmlInput.className,
              type: htmlInput.type,
              placeholder: htmlInput.placeholder,
              inputmode: htmlInput.inputMode,
              outerHTML: htmlInput.outerHTML.substring(0, 100) + '...'
            })
            
            // 检查是否是Polymarket的输入框
            const isPolymarketInput = htmlInput.matches('input[inputmode="decimal"]') ||
                                     htmlInput.className.includes('c-fPFMNh') ||
                                     (htmlInput.placeholder === '0' && htmlInput.type === 'text')
            
            if (isPolymarketInput && htmlInput.value) {
              foundValue = htmlInput.value
              console.log(`✅ 找到Polymarket输入框! 值: "${htmlInput.value}"`)
            }
          })
          
          console.log(`📤 返回输入值: "${foundValue}"`)
          sendResponse({ value: foundValue })
        }

        return true
      },
    )
  }, [inputValue])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.keyCode === 75) {
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener('keydown', handleShortcut)

    return () => {
      document.removeEventListener('keydown', handleShortcut)
    }
  }, [isOpen])

  const onClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      <DraggableBox isOpen={isOpen} onClose={onClose} />
    </>
  )
}

export default PlasmoOverlay
