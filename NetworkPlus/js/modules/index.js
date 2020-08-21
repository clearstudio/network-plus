import { jsonBeautify, headersJsonSort, isJSON } from './utils.js'

// eslint-disable-next-line no-undef
const app = new Vue({
  el: '#app',
  data() {
    return {
      mainPanel: { show: false },
      pauseBtnStatus: { icon: 'el-icon-video-pause', recording: true, title: 'Stop recording network log' },
      asideWidth: '100%',
      url: '',
      method: '',
      status: '',
      responseHeader: '{}',
      requestHeader: '{}',
      requestPayload: '{}',
      preview: '',
      activeTab: 'headers',
      activeCollapses: ['General', 'Response Headers', 'Request Headers', 'Request Payload'],
      tableData: [],
      search: ''
    }
  },
  computed: {
    searchedTableData: function() {
      return this.tableData.filter(data => !this.search || data.request.url.toLowerCase().includes(this.search.toLowerCase()))
    }
  },
  watch: {
    searchedTableData: function(newSearchedTableData, oldSearchedTableData) {
      if (newSearchedTableData.length === 0) {
        this.asideWidth = '100%'
        this.mainPanel.show = false
      }
    }
  },
  methods: {
    // 发送按钮
    resendBtnClicked() {
      const editUrl = document.getElementById('edit-url').innerText
      const editMethod = document.getElementById('edit-method').innerText
      let editRequestHeaders = ''
      const editRequestHeadersStr = document.getElementById('edit-request-headers').innerText
      let editRequestBody = ''
      const editRequestBodyStr = document.getElementById('edit-request-body').innerText

      if (isJSON(editRequestHeadersStr)) {
        editRequestHeaders = JSON.stringify(JSON.parse(editRequestHeadersStr))
      } else {
        editRequestHeaders = '{}'
      }

      if (isJSON(editRequestBodyStr)) {
        editRequestBody = JSON.stringify(JSON.parse(editRequestBodyStr))
      } else {
        editRequestBody = editRequestBodyStr === '\n' ? '{}' : editRequestBodyStr
      }

      const functionStr = `networkPlusXhr('${editUrl}','${editMethod}','${editRequestHeaders}','${editRequestBody}')`
      const escapedFunctionStr = functionStr.replace(/\\"/g, '\\\\\\"')
      chrome.devtools.inspectedWindow.eval(escapedFunctionStr, function(result, isException) {
        // console.log(isException);
      })
    },
    pauseBtnClicked() {
      if (this.pauseBtnStatus.recording === true) {
        this.pauseBtnStatus.icon = 'el-icon-video-play'
        this.pauseBtnStatus.recording = false
        this.pauseBtnStatus.title = 'Start recording network log'
        stopRecord()
      } else {
        this.pauseBtnStatus = this.$options.data().pauseBtnStatus
        startRecord()
      }
    },
    clearBtnClicked() {
      this.tableData = []
    },
    // 表格行单击
    tableRowClicked(val) {
      this.mainPanel.show = true
      this.asideWidth = '300px'

      this.url = val.request.url
      this.method = val.request.method
      this.status = val.response.status
      this.requestHeader = headersJsonSort(val.request.headers)

      if (val.request.postData) {
        const body = val.request.postData.text || '{}'
        if (isJSON(body)) {
          this.requestPayload = JSON.stringify(JSON.parse(body), null, 4)
        } else {
          this.requestPayload = body
        }
      } else {
        this.requestPayload = '{}'
      }

      if (val.response) {
        this.responseHeader = headersJsonSort(val.response.headers)
        if (typeof val.response.body === 'string') {
          if (isJSON(val.response.body)) {
            this.preview = jsonBeautify(JSON.stringify(JSON.parse(val.response.body), null, 4))
          } else {
            this.preview = val.response.body
          }
        } else {
          this.preview = ''
        }
      }
    }
  }
})

function listenerCallback(requestInfo) {
  requestInfo.getContent((body) => {
    if (!requestInfo._resourceType || requestInfo._resourceType === 'fetch' || requestInfo._resourceType === 'xhr') {
      const request = requestInfo.request
      const urlPieces = request.url.split('/')
      if (urlPieces[urlPieces.length - 1]) {
        request.name = urlPieces[urlPieces.length - 1]
      } else {
        request.name = urlPieces[urlPieces.length - 2] + '/'
      }
      const requestHeaders = {}
      request.headers.forEach(header => {
        requestHeaders[header.name] = header.value
      })
      request.headers = requestHeaders

      const response = requestInfo.response
      response.body = body
      const responseHeaders = {}
      response.headers.forEach(header => {
        responseHeaders[header.name] = header.value
      })
      response.headers = responseHeaders

      const data = { request: request, response: response }
      app.tableData.push(data)
    }
  })
}

function startRecord() {
  chrome.devtools.network.onRequestFinished.addListener(listenerCallback)
}

function stopRecord() {
  chrome.devtools.network.onRequestFinished.removeListener(listenerCallback)
}

startRecord()
// window.app = app;
