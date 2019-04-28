import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

const TAB_FILTER_URLS = ["http://*/*", "https://*/*"];

AddonSettings.setCaching(false);
let gettingFakedColorStatus = AddonSettings.get("fakedColorStatus"); // TODO: receive update

/**
 * Inserts content script.
 *
 * @private
 * @param {Object} tab
 * @returns {void}
 */
function insertContentScriptFast(tab) {
    // inject pointer to let content script know in which tab
    // it is running
    const injectingTabId = browser.tabs.executeScript(tab.id, {
        code: `const MY_TAB_ID = ${tab.id}`,
        allFrames: true,
        runAt: "document_start"
    });

    // if loaded, inject value of settings to let it know what to adjust
    const injectingSettings = gettingFakedColorStatus.then((fakedColorStatus) => {
        return browser.tabs.executeScript(tab.id, {
            code: `
                // apply setting value
                fakedColorStatus = COLOR_STATUS["${fakedColorStatus.toUpperCase()}"]
                applyWantedStyle(); // call to apply CSS
            `,
            allFrames: true,
            runAt: "document_start" // run later, so we make sure COLOR_STATUS is already loaded
        });
    }).then(() => {
        browser.tabs.executeScript(tab.id, {
            code: "applyWantedStyle()",
            allFrames: true,
            runAt: "document_end" // run later, where all CSS should be loaded
        });
    });

    return Promise.all([
        injectingTabId,
        injectingSettings
    ]);
}

/**
 * Init module.
 *
 * @function
 * @returns {void}
 */
export function init() {
    // inject in all tabs that we have permission for
    browser.tabs.query({
        url: TAB_FILTER_URLS
    }).then((tabs) => {
        return Promise.all(tabs.map(insertContentScriptFast));
    }).then(() => {
        console.log("inserted content script into all pages");
    }).catch(console.error);

    browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
        /*
        only run additional injection if:
            * the url is changed (when navigating to a new tab)
            * the status is still loading (to exclude simple #anchor changes)
        */
        if ("url" in changeInfo && tabInfo.status === "loading") {
            console.log("insert insertContentScriptFast into tab", tabId, tabInfo);
            insertContentScriptFast(tabInfo).catch(console.error);
        }
    }, {
        urls: TAB_FILTER_URLS
    });
}

// register update for setting
BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.NEW_SETTING, (request) => {
    // TODO: dead code, currently
    gettingFakedColorStatus = Promise.resolve(request.fakedColorStatus);
});
