
let BLOCKED_URLS = new Set()
const CONTEXT_MENU_ID = 'menu-block-unblock-url'

chrome.runtime.onInstalled.addListener(function () {
  // Context Menu
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Block url',
    contexts: ['page']
  })
  loadState()
  updateUI()
})

chrome.runtime.onStartup.addListener(function () {
  loadState()
  updateUI()
})

// Functions

function loadState () {
  chrome.storage.sync.get('state', (items) => {
    const { state } = items
    if (state instanceof Array) {
      BLOCKED_URLS = new Set(state)
    }
    console.log('load state, blocked urls:')
    console.log(BLOCKED_URLS)
  })
}

function saveState () {
  chrome.storage.sync.set({ state: [...BLOCKED_URLS] }, () => {
    console.log('state saved')
  })
}

function updateUI () {
  chrome.tabs.getSelected((tab) => {
    if (BLOCKED_URLS.has(tab?.url)) {
      chrome.browserAction.setIcon({ path: 'icons/blocked.png' })
      chrome.browserAction.setTitle({ title: 'Url Blocker: blocked' })
      chrome.contextMenus.update(CONTEXT_MENU_ID, { title: 'Url Blocker: unblock' })
    } else {
      chrome.browserAction.setIcon({ path: 'icons/unblocked.png' })
      chrome.browserAction.setTitle({ title: 'Url Blocker' })
      chrome.contextMenus.update(CONTEXT_MENU_ID, { title: 'Url Blocker: block' })
    }
  })
}

function toggleBlockURL () {
  chrome.tabs.getSelected((tab) => {
    if (tab.url !== null && tab.url.trim() !== '') {
      if (BLOCKED_URLS.has(tab.url)) {
        BLOCKED_URLS.delete(tab.url)
        console.log(`Url unblocked: ${tab.url}`)
      } else {
        BLOCKED_URLS.add(tab.url)
        console.log(`Url blocked: ${tab.url}`)
      }
      updateUI()
      saveState()
    }
  })
}

// Event Handlers

/// key event handler
chrome.commands.onCommand.addListener((command) => {
  if (command === 'block-unblock-url') {
    toggleBlockURL()
  }
})

/// context menu event handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID) {
    toggleBlockURL()
  }
})

// onBeforeRequest
chrome.webRequest.onBeforeRequest.addListener(
  // callback
  (details) => {
    return BLOCKED_URLS.has(details.url)
      ? { cancel: true }
      : { cancel: false }
  },
  // filters
  { urls: ['<all_urls>'] },
  // extraInfoSpec
  ['blocking'])

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  updateUI()
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  updateUI()
})
