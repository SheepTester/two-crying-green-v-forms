import chrome from '../utils/extension/chrome.js'

// Open the account transactions page on clicking the icon
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: 'https://eacct-ucsd-sp.transactcampus.com/eAccounts/AccountTransaction.aspx'
  })
})
