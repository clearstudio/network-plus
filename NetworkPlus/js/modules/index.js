import { jsonBeautify, isJSON } from './utils.js'
import dragAndResize from './resizablePanel.js'

const app = new Vue({
  el: '#app',
  mounted() {
    dragAndResize(this.$refs.resizablePanel.$el, this.$refs.resizeBar, this.$refs.panelLeft.$el, this.$refs.panelRight.$el)
  },
  data() {
    return {
      mainPanel: { show: false },
      pauseBtnStatus: { icon: 'el-icon-video-pause', recording: true, title: 'Stop recording network log' },
      pauseBtnClickedStatus: { icon: 'el-icon-video-play', recording: false, title: 'Start recording network log' },
      asideWidth: '100%',
      url: '',
      method: '',
      status: '',
      responseHeader: '',
      requestHeader: '',
      requestPayload: '{}',
      preview: '',
      activeTab: 'headers',
      activeCollapses: ['General', 'Response Headers', 'Request Headers', 'Request Payload'],
      tableData: [],
      search: ''
    }
  },
  computed: {
    searchedTableData() {
      return this.tableData.filter(data => !this.search || data.request.url.toLowerCase().includes(this.search.toLowerCase()))
    }
  },
  watch: {
    searchedTableData(newSearchedTableData) {
      if (newSearchedTableData.length === 0) {
        this.asideWidth = '100%'
        this.mainPanel.show = false
      }
    }
  },
  methods: {
    // 发送按钮
    resendBtnClicked() {
      const editUrl = this.url
      const editMethod = document.getElementById('edit-method').innerText
      const editRequestHeadersStr = document.getElementById('edit-request-headers').innerText
      let editRequestBody = ''
      const editRequestBodyStr = document.getElementById('edit-request-body').innerText

      if (isJSON(editRequestBodyStr)) {
        editRequestBody = JSON.stringify(JSON.parse(editRequestBodyStr))
      } else {
        editRequestBody = editRequestBodyStr === '\n' ? '{}' : editRequestBodyStr
      }

      const functionStr = `__NETWORK_PLUS_XHR__('${editUrl}','${editMethod}','${editRequestHeadersStr}','${editRequestBody}')`
      const escapedFunctionStr = functionStr.replace(/\n/g, '\\n').replace(/\\"/g, '\\\\\\"')
      chrome.devtools.inspectedWindow.eval(escapedFunctionStr, (result, isException) => {
        // console.log(result, isException)
      })
    },
    pauseBtnClicked() {
      if (this.pauseBtnStatus.recording === true) {
        this.pauseBtnStatus = this.pauseBtnClickedStatus
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
      this.asideWidth = '313px'

      this.url = val.request.url
      this.method = val.request.method
      this.status = val.response.status
      this.requestHeader = val.request.headers

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
        this.responseHeader = val.response.headers
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
      request.name = urlPieces[urlPieces.length - 1] || urlPieces[urlPieces.length - 2] + '/'
      let requestHeaders = ''
      request.headers.sort((a, b) => a.name.localeCompare(b.name)).forEach(header => {
        requestHeaders += `${header.name}: ${header.value}\n`
      })
      request.headers = requestHeaders

      const response = requestInfo.response
      response.body = body
      let responseHeaders = ''
      response.headers.sort((a, b) => a.name.localeCompare(b.name)).forEach(header => {
        responseHeaders += `${header.name}: ${header.value}\n`
      })
      response.headers = responseHeaders

      const data = { request, response }
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
