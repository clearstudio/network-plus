  <template>
        <el-container>
            <el-header>
                <div style="display: inline-block;vertical-align: middle;padding-right:45px;">
                    <el-input placeholder="Search" v-model="search" prefix-icon="el-icon-search" size="small" clearable
                        style="width: 290px;" spellcheck="false"></el-input>
                </div>
                <div style="display: inline-block;vertical-align: middle;">
                    <el-button-group>
                        <el-button size="small" :icon="pauseBtnStatus.icon" :title="pauseBtnStatus.title"
                            @click="pauseBtnClicked" ref="pauseBtn">
                        </el-button>
                        <el-button size="small" icon="el-icon-delete" title="Clear" @click="clearBtnClicked">
                        </el-button>
                    </el-button-group>
                </div>
            </el-header>
            <el-container ref="resizablePanel">
                <el-aside :width="asideWidth" ref="panelLeft">
                    <el-table :data="searchedTableData" height="100%" highlight-current-row
                        @row-click="tableRowClicked">
                        <div slot="empty">Recording network activity...<br>
                            Perform a request or hit <span style="font-weight: bold;">Ctrl</span> + <span
                                style="font-weight: bold;">R</span> to record the refresh.</div>
                        <el-table-column prop="name" label="Name" :show-overflow-tooltip="true" class-name="col-url">
                            <template slot-scope="scope">
                                <span :title="scope.row.request.url">{{ scope.row.request.name }}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-aside>
                <div ref="resizeBar"
                    style="cursor: ew-resize;width: 3px; height: calc(100% - 100px); top: 40px; border-left:solid #E4E7ED 2px;">
                </div>
                <el-main v-show="mainPanel.show" ref="panelRight">
                    <el-tabs v-model="activeTab">
                        <el-tab-pane label="Headers" name="headers">
                            <el-collapse v-model="activeCollapses">

                                <el-collapse-item title="General" name="General">
                                    <div class="show-editable">
                                        <label>Request URL: </label>
                                        <el-input type="textarea" autosize id="edit-url" v-model="url" resize="none"
                                            style="vertical-align:top; width: calc(100% - 81.15px);" spellcheck="false">
                                        </el-input><br>
                                        <label>Request Method: </label><span contentEditable id="edit-method"
                                            v-text="method" spellcheck="false"></span><br>
                                        <label>Status Code: </label><span>{{ status }}</span>
                                    </div>
                                </el-collapse-item>

                                <el-collapse-item title="Request Payload" name="Request Payload">
                                    <div class="show-editable">
                                        <pre contentEditable id="edit-request-body" v-text="requestPayload"
                                            spellcheck="false"></pre>
                                    </div>
                                </el-collapse-item>

                                <el-collapse-item title="Request Headers" name="Request Headers">
                                    <div class="show-editable">
                                        <pre contentEditable id="edit-request-headers" v-text="requestHeader"
                                            spellcheck="false"></pre>
                                    </div>
                                </el-collapse-item>

                                <el-collapse-item title="Response Headers" name="Response Headers">
                                    <pre>{{ responseHeader }}</pre>
                                </el-collapse-item>

                            </el-collapse>
                        </el-tab-pane>
                        <el-tab-pane label="Preview" name="preview">
                            <pre id="preview-pre" v-html="preview"></pre>
                        </el-tab-pane>
                    </el-tabs>
                    <el-button type="primary" icon="el-icon-position" circle class="resend" @click="resendBtnClicked"
                        ref="resendBtn" title="Send"></el-button>
                </el-main>
            </el-container>
        </el-container>
</template>

  <script>
import { jsonBeautify, isJson } from '@/utils/utils'
import dragAndResize from '@/utils/resizablePanel'

export default {
    name: 'HomePage',
    mounted() {
        dragAndResize(this.$refs.resizablePanel.$el, this.$refs.resizeBar, this.$refs.panelLeft.$el, this.$refs.panelRight.$el)
        this.startRecord()
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

            if (isJson(editRequestBodyStr)) {
                editRequestBody = JSON.stringify(JSON.parse(editRequestBodyStr))
            } else {
                editRequestBody = editRequestBodyStr === '\n' ? '{}' : editRequestBodyStr
            }

            const functionStr = `__NETWORK_PLUS_XHR__('${editUrl}','${editMethod}','${editRequestHeadersStr}','${editRequestBody}')`
            const escapedFunctionStr = functionStr.replace(/\n/g, '\\n').replace(/\\"/g, '\\\\\\"')
            chrome.devtools.inspectedWindow.eval(escapedFunctionStr, (result, isException) => {
                console.log(result, isException)
            })
        },
        pauseBtnClicked() {
            if (this.pauseBtnStatus.recording === true) {
                this.pauseBtnStatus = this.pauseBtnClickedStatus
                this.stopRecord()
            } else {
                this.pauseBtnStatus = this.$options.data().pauseBtnStatus
                this.startRecord()
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
                if (isJson(body)) {
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
                    if (isJson(val.response.body)) {
                        this.preview = jsonBeautify(JSON.stringify(JSON.parse(val.response.body), null, 4))
                    } else {
                        this.preview = val.response.body
                    }
                } else {
                    this.preview = ''
                }
            }
        },
        listenerCallback(requestInfo) {
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
                    this.tableData.push(data)
                }
            })
        },
        startRecord() {
            chrome.devtools.network.onRequestFinished.addListener(this.listenerCallback)
        },
        stopRecord() {
            chrome.devtools.network.onRequestFinished.removeListener(this.listenerCallback)
        }
    }
}

</script>

  <style>
  /* 滚动条 */
  
  ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
  }
  
  ::-webkit-scrollbar-corner {
      background-color: #fff;
  }
  
  ::-webkit-scrollbar-thumb {
      background-color: rgba(144, 147, 153, 0.5);
  }
  
  ::-webkit-scrollbar-track {
      background-color: #fff;
  }
  
  html {
      overflow: hidden;
  }
  
  body {
      margin: 0;
      padding: 8px;
  }
  
  html,
  body {
      height: 100%;
      background: #fff;
  }
  
  .el-container {
      height: 100%;
  }
  
  .el-header {
      height: 33px;
      padding: 0;
  }
  
  .el-aside {
      height: calc(100% - 100px);
  }
  
  .el-main {
      width: 0;
      padding-top: 0;
      padding-bottom: 0;
      padding-right: 0;
      height: calc(100% - 100px);
      overflow: hidden;
      border-bottom: 1px solid #EBEEF5;
  }
  
  .json-key {
      color: #792675;
  }
  
  .json-number {
      color: #0D22AA;
  }
  
  .json-string {
      color: #000000;
  }
  
  .json-boolean {
      color: #0D22AA;
  }
  
  .json-null {
      color: #666666;
  }
  
  label {
      font-weight: 500;
  }
  
  pre {
      overflow-y: auto;
      font-family: none;
  }
  
  .show-editable:hover {
      background: url(../assets/pencil.svg) no-repeat top right 8px;
      background-position-y: 5px;
  }
  
  [contentEditable]:focus,
  .el-textarea__inner:focus {
      outline: none;
      background-color: #ECF5FF;
      transition: background-color .2s cubic-bezier(.645, .045, .355, 1);
  }
  
  .el-textarea__inner {
      border: none;
      padding: 2px 0;
      font-size: 13px;
      font-family: inherit;
      color: #303133;
      background-color: rgba(0, 0, 0, 0);
  }
  
  [v-cloak] {
      display: none;
  }
  
  /* 表格只显示一行文字 */
  
  .el-tooltip__popper.is-dark {
      display: none !important;
  }
  
  /* 表格 url 列 */
  
  .col-url {
      cursor: pointer;
  }
  
  /* 面板标题 */
  
  .el-collapse-item__header {
      font-weight: bold;
  }
  
  .el-tabs {
      height: 100%;
  }
  
  .el-tabs__header {
      position: fixed;
      z-index: 999;
      background-color: white;
      width: 100%;
  }
  
  .el-tabs__content {
      padding-top: 39px;
      height: calc(100% - 37.8px);
  }
  
  .el-tab-pane {
      overflow: auto;
      height: 100%;
  }
  
  #pane-preview {
      overflow-y: hidden;
  }
  
  #preview-pre {
      font-size: 15px;
      height: calc(100% - 31.4px);
      margin: 0;
      padding: 15px 0;
  }
  
  .resend {
      position: fixed !important;
      right: 80px !important;
      bottom: 80px !important;
  }
  </style>