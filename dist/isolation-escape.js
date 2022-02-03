// Has access outside of the content script's isolated world

// https://stackoverflow.com/a/9636008
document.addEventListener('twocryinggreenvforms', event => {
  if (!event.detail?.type) return
  switch (event.detail.type) {
    case 'eval': {
      eval(event.detail.js)
      break
    }
  }
})
