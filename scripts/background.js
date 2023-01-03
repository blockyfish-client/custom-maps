var options = {};

var DEFAULTS = {
	redirectAssets: true
};

function setDefaults() {
	chrome.storage.sync.get(DEFAULTS, function (obj) {
		chrome.storage.sync.set(obj, syncSettings);
	});
}

chrome.runtime.onInstalled.addListener(function (info) {
	setDefaults();
});

function syncSettings() {
	chrome.storage.sync.get(DEFAULTS, function (obj) {
		Object.assign(options, obj);
		console.log(options);

		let color = options.redirectAssets ? "#09e36e" : "#f23030";
		let text = options.redirectAssets ? "✔️" : "✖️";

		chrome.browserAction.setBadgeBackgroundColor({
			color: color
		});
		chrome.browserAction.setBadgeText({
			text: text
		});
	});

	console.log("sync settings running");
}

syncSettings();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request == "sync-settings") {
		syncSettings();
	}
});

function toggleRedirect() {
	options.redirectAssets = !options.redirectAssets;

	chrome.storage.sync.set(options, syncSettings);
}

chrome.browserAction.onClicked.addListener(toggleRedirect);

const alreadyChecked = new Set();
function genericHandler(redirectTemplate, regex, name, filenameKeys = ["filename"]) {
	function handler(details) {
		let redirectUrl = details.url;

		const m = regex.exec(details.url); // checks if might be valid X

		console.log(`original ${name} URL is ${details.url}`);

		if (m) {
			const filenameArray = filenameKeys.map((key) => m.groups[key] || "");
			const filename = filenameArray.join("");

			console.log(filename);

			let newRedirectUrl = redirectTemplate + filename; // redirect it

			if (!alreadyChecked.has(newRedirectUrl)) {
				let checkRequest = new XMLHttpRequest(); // creates HTTP request

				checkRequest.open("GET", newRedirectUrl, false); // sets up request
				checkRequest.send(); // sends the request

				if (checkRequest.status >= 200 && checkRequest.status < 300) {
					// redirect exists
					redirectUrl = newRedirectUrl;

					console.log(`Redirecting to ${newRedirectUrl}`);
				} else {
					tempMarkChecked(newRedirectUrl);

					console.log(`${newRedirectUrl} does not exist. Using default.`);
				}
			} else {
				console.log(`Already checked ${newRedirectUrl}`);
			}
		}

		return {
			redirectUrl: redirectUrl
		};
	}

	return handler;
}

var fishy_ffa_urls = [];

var getServerList = new XMLHttpRequest();
getServerList.addEventListener("load", () => {
	var data = JSON.parse(this.responseText);
	for (let i = 0; i < data.hosts.length; i++) {
		if (data.hosts[i].map.string_id == "fishy_ffa") {
			fishy_ffa_url.push(`https://*.deeeep.io/${data.hosts[i].id}/*`);
		}
	}
});
getServerList.open("GET", "https://apibeta.deeeep.io/hosts", false);
getServerList.send();

const FISHY_FFA_REDIRECT_TEMPLATE = "https://deeeepio-custom-maps.netlify.app/fishy_ffa/"; // redirect URLs are all from this

const fishy_ffa_Handler = genericHandler(FISHY_FFA_REDIRECT_TEMPLATE, /.*/, "fishy_ffa");

chrome.webRequest.onBeforeRequest.addListener(
	fishy_ffa_Handler,
	{
		urls: fishy_ffa_urls,
		types: ["script"]
	},
	["blocking"]
);
