(function() {
  const unsafeHeaders = [
    'Accept-Charset',
    'Accept-Encoding',
    'Access-Control-Request-Headers',
    'Access-Control-Request-Method',
    'Connection',
    'Content-Length',
    'Cookie',
    'Cookie2',
    'Date',
    'DNT',
    'Expect',
    'Host',
    'Keep-Alive',
    'Origin',
    'Referer',
    'TE',
    'Trailer',
    'Transfer-Encoding',
    'Upgrade',
    'User-Agent',
    'Via',
    'Sec-.*',
    'Proxy-.*',
    ':*'
  ]

  function isSafeHeader(headerName) {
    for (const unsafeHeader of unsafeHeaders) {
      const reg = new RegExp(`^${unsafeHeader}$`, 'i')
      if (reg.test(headerName)) {
        return false
      }
    }
    return true
  }

  function plainText2Arr(text) {
    const lines = text.split('\n')
    const arr = []
    lines.forEach(line => {
      if (line.trim()) {
        const json = {}
        const name = line.split(/[ ]*:[ ]*/, 1)[0]
        json.name = name
        json.value = line.replace(`${name}`, '').replace(/[ ]*:[ ]*/, '')
        arr.push(json)
      }
    })
    return arr
  }

  window.__NETWORK_PLUS_XHR__ = function(url, method, headersStr, bodyStr) {
    const xhr = new XMLHttpRequest()
    xhr.addEventListener('readystatechange', function() {
      /* if (this.readyState === 4) {
				console.log(this.responseText);
			} */
    })
    xhr.open(method, url)
    const headers = plainText2Arr(headersStr)
    headers.forEach(header => {
      if (isSafeHeader(header.name)) {
        xhr.setRequestHeader(header.name, header.value)
      }
    })
    xhr.send(bodyStr)
  }
})()
