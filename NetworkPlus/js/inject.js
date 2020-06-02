function isSafeHeader(headerName) {
	let unsafeHeaders =
		['Accept-Charset',
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
			'Proxy-.*'];

	for (let unsafeHeader of unsafeHeaders) {
		let reg = new RegExp(`^${unsafeHeader}$`, 'i');
		if (reg.test(headerName)) {
			return false;
		}
	}
	return true;
}

window.networkPlusXhr = function (url, method, headersStr, bodyStr) {
	let xhr = new XMLHttpRequest();
	xhr.addEventListener("readystatechange", function () {
		if (this.readyState === 4) {
			//console.log(this.responseText);
		}
	});
	xhr.open(method, url);
	let headers = JSON.parse(headersStr);
	for (headerName in headers) {
		if (isSafeHeader(headerName)) {
			xhr.setRequestHeader(headerName, headers[headerName]);
		}
	}
	xhr.send(bodyStr);
}