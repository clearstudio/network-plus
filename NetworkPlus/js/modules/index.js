import { jsonBeautify } from './json-beautify.js';
import { isJSON } from './check-json-str.js';

let app = new Vue({
    el: '#app',
    data() {
        return {
            panelStyle: { display: 'none' },
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
        searchedTableData: function () {
            return this.tableData.filter(data => !this.search || data.request.url.toLowerCase().includes(this.search.toLowerCase()))
        }
    },
    watch: {
        searchedTableData: function (newSearchedTableData, oldSearchedTableData) {
            if (newSearchedTableData.length === 0) {
                this.asideWidth = '100%';
                this.panelStyle.display = 'none';
            }
        }
    },
    methods: {
        //发送按钮
        resendBtnClicked() {
            let editUrl = document.getElementById('edit-url').innerText;
            let editMethod = document.getElementById('edit-method').innerText;
            let editRequestHeaders = '';
            let editRequestHeadersStr = document.getElementById('edit-request-headers').innerText;;
            let editRequestBody = '';
            let editRequestBodyStr = document.getElementById('edit-request-body').innerText;

            if (isJSON(editRequestHeadersStr)) {
                editRequestHeaders = JSON.stringify(JSON.parse(editRequestHeadersStr));
            } else {
                editRequestHeaders = '{}'
            }

            if (isJSON(editRequestBodyStr)) {
                editRequestBody = JSON.stringify(JSON.parse(editRequestBodyStr));
            } else {
                editRequestBody = editRequestBodyStr === '\n' ? '{}' : editRequestBodyStr;
            }

            let functionStr = `networkPlusXhr('${editUrl}','${editMethod}','${editRequestHeaders}','${editRequestBody}')`;
            let escapedFunctionStr = functionStr.replace(/\\"/g, '\\\\\\"');
            chrome.devtools.inspectedWindow.eval(escapedFunctionStr, function (result, isException) {
                //console.log(isException);
            }
            );
        },
        pauseBtnClicked() {
            if (this.pauseBtnStatus.recording === true) {
                this.pauseBtnStatus.icon = 'el-icon-video-play';
                this.pauseBtnStatus.recording = false;
                this.pauseBtnStatus.title = 'Start recording network log';
                stopRecord();
            } else {
                this.pauseBtnStatus = this.$options.data().pauseBtnStatus;
                startRecord();
            }
        },
        clearBtnClicked() {
            this.tableData = [];
        },
        //表格行单击
        tableRowClicked(val) {
            this.panelStyle.display = 'block';
            this.asideWidth = '300px';

            this.url = val.request.url;
            this.method = val.request.method;
            this.status = val.response.status;
            if (val.request.headers) {
                this.requestHeader = JSON.stringify(val.request.headers, null, 4);
            } else {
                this.requestHeader = '{}';
            }

            if (val.request.postData) {
                let body = val.request.postData.text || '{}';
                if (isJSON(body)) {
                    this.requestPayload = JSON.stringify(JSON.parse(body), null, 4);
                } else {
                    this.requestPayload = body;
                }
            } else {
                this.requestPayload = '{}';
            }

            if (val.response) {
                this.responseHeader = JSON.stringify(val.response.headers, null, 4);
                if (typeof val.response.body === 'string') {
                    if (isJSON(val.response.body)) {
                        this.preview = jsonBeautify(JSON.stringify(JSON.parse(val.response.body), null, 4));
                    } else {
                        this.preview = val.response.body;
                    }
                } else {
                    this.preview = '';
                }
            }
        }
    }
});


function listenerCallback(requestInfo) {
    requestInfo.getContent((body) => {
        if (!requestInfo._resourceType || requestInfo._resourceType === 'fetch' || requestInfo._resourceType === 'xhr') {
            let request = requestInfo.request;
            let urlPieces = request.url.split('/');
            if (urlPieces[urlPieces.length - 1]) {
                request.name = urlPieces[urlPieces.length - 1];
            } else {
                request.name = urlPieces[urlPieces.length - 2] + '/';
            }
            let requestHeaders = {};
            request.headers.forEach(header => {
                requestHeaders[header.name] = header.value;
            });
            request.headers = requestHeaders;

            let response = requestInfo.response;
            response.body = body;
            let responseHeaders = {};
            response.headers.forEach(header => {
                responseHeaders[header.name] = header.value;
            });
            response.headers = responseHeaders;

            let data = { 'request': request, 'response': response };
            app.tableData.push(data);
        }
    })
}


function startRecord() {
    chrome.devtools.network.onRequestFinished.addListener(listenerCallback);
}

function stopRecord() {
    chrome.devtools.network.onRequestFinished.removeListener(listenerCallback);
}

startRecord();
//window.app = app;