import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

const TAB_FILTER_URLS = ["<all_urls>"];
let lastContentScript = null;

AddonSettings.setCaching(false);

/**
 * Adds a content script that is injected by Firefox and provides the preloaded
 * value of fakedColorStatus.
 *
 * @private
 * @param {string} [fakedColorStatus]
 * @returns {Promise}
 */
export async function injectContentScript(fakedColorStatus) {
    const settings = {
        fakedColorStatus: fakedColorStatus || await AddonSettings.get("fakedColorStatus"),
        functionalMode: await AddonSettings.get("functionalMode")
    };

    // add new code injection
    const newContentScript = await browser.contentScripts.register({
        matches: TAB_FILTER_URLS,
        js: [{
            code: `;
                    var initialSettings = JSON.parse('${JSON.stringify(settings)}');
                    if (typeof initializeContentScripts === "function") {
                        initializeContentScripts(initialSettings);
                    }
                `,
        }],
        allFrames: true,
        matchAboutBlank: true,
        runAt: "document_start"
    });

    // remove old one
    if (lastContentScript) {
        lastContentScript.unregister();
    }

    lastContentScript = newContentScript;
}

/**
 * Manually trigger overwriting CSS.
 *
 * This requires the TAB_ID to be set before, so run {@link injectTabId} before!
 * Also requires the `fakedColorStatus` setting to be loaded, already.
 *
 * @private
 * @param {Object} tab
 * @returns {Promise}
 */
function triggerCssOverwrite(tab) {
    // inject pointer to let content script know in which tab
    // it is running
    return browser.tabs.executeScript(tab.id, {
        code: "applyWantedStyle()",
        allFrames: true,
        runAt: "document_end" // run later, where all CSS should be loaded
    }).then(() => {
        console.info("triggered CSS analysis/overwrite for tab", tab.id, tab);
    });
}

/**
 * Init module.
 *
 * @function
 * @returns {void}
 */
export async function init() {
    // inject current preloaded setting to all tabs, so we have it as fast as possible
    await injectContentScript();

    // trigger CSS replace for existing tabs
    browser.tabs.query({
        url: TAB_FILTER_URLS
    }).then((tabs) => {
        return Promise.all(tabs.map(triggerCssOverwrite));
    }).then(() => {
        console.info("inserted content script into all pages");
    }).catch(console.error);
}

// register update for setting
BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.NEW_SETTING, (request) => {
    console.info("Received new fakedColorStatus setting:", request);

    return injectContentScript();
});
BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.NEW_ADDIONAL_SETTINGS, (request) => {
    console.info("Received new NEW_ADDIONAL_SETTINGS setting:", request);

    return injectContentScript();
});
