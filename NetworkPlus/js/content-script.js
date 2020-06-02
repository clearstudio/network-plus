document.addEventListener('DOMContentLoaded', function () {
	injectCustomJs('js/inject.js');
});

function injectCustomJs(jsPath) {
	jsPath = jsPath || 'js/inject.js';
	let temp = document.createElement('script');
	temp.setAttribute('type', 'text/javascript');
	temp.src = chrome.extension.getURL(jsPath);
	temp.onload = function () {
		this.parentNode.removeChild(this);
	};
	document.body.appendChild(temp);
}