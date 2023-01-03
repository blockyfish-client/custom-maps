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

const MISC_REDIRECT_TEMPLATE = "https://hacked-doc-assets.netlify.app/images/misc/"; // redirect URLs are all from this
const MISC_SCHEME = "*://*.deeeep.io/assets/*"; // these urls will be redirected like ui sprites
const MISC_REGEX = /.+\/assets\/(?<filename>.+\.js)(?:\?.*)?$/; // might it be a valid ui sprite?

const miscHandler = genericHandler(MISC_REDIRECT_TEMPLATE, MISC_REGEX, "misc");

chrome.webRequest.onBeforeRequest.addListener(
	miscHandler,
	{
		urls: [MISC_SCHEME],
		types: ["script"]
	},
	["blocking"]
);
