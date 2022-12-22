import browser from "webextension-polyfill";

console.log("Hello from the popup!", { id: browser.runtime.id });
