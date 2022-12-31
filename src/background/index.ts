import chrome from '../utils/extension/chrome.js'

const EACCOUNTS_URL =
  'https://eacct-ucsd-sp.transactcampus.com/eAccounts/TwoCryingGreenVForms.aspx'
const GITHUB_URL = 'https://github.com/SheepTester/two-crying-green-v-forms'

// Open the account transactions page on clicking the icon
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: EACCOUNTS_URL })
})

chrome.contextMenus.create({
  id: 'open-eaccounts',
  title: 'Open Dining Dollar analysis',
  contexts: ['action']
})
chrome.contextMenus.create({
  id: 'view-github',
  title: 'View source on GitHub',
  contexts: ['action']
})
chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === 'open-eaccounts') {
    chrome.tabs.create({ url: EACCOUNTS_URL })
  } else if (info.menuItemId === 'view-github') {
    chrome.tabs.create({ url: GITHUB_URL })
  }
})
