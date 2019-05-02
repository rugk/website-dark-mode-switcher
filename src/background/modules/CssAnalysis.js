import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

const TAB_FILTER_URLS = ["http://*/*", "https://*/*"];
let lastSettingsInjection = null;

AddonSettings.setCaching(false);

/**
 * Adds a content script that is injected by Firefox and provides the preloaded
 * value of fakedColorStatus.
 *
 * @private
 * @returns {Promise}
 */
async function enableSettingInjection() {
    const fakedColorStatus = await AddonSettings.get("fakedColorStatus");

    return browser.contentScripts.register({
        matches: TAB_FILTER_URLS,
        js: [{
            code: `
                    // apply setting value
                    fakedColorStatus = COLOR_STATUS["${fakedColorStatus.toUpperCase()}"]
                    console.log("updated fakedColorStatus via background script injection to", fakedColorStatus);
                `,
        }],
        allFrames: true,
        matchAboutBlank: true,
        runAt: "document_start"
    }).then(() => {
        // apply CSS when website is really loaded
        browser.contentScripts.register({
            matches: TAB_FILTER_URLS,
            js: [{
                code: `
                        applyWantedStyle("slow call"); // call to apply CSS
                    `,
            }],
            allFrames: true,
            matchAboutBlank: true,
            runAt: "document_end" // run later, where all CSS should be loaded
        });
    });
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
        console.log("triggered CSS analysis/overwrite for tab", tab.id, tab);
    });
}

/**
 * Init module.
 *
 * @function
 * @returns {void}
 */
export function init() {
    // inject current preloaded setting to all tabs, so we have it as fast as possible
    lastSettingsInjection = enableSettingInjection();

    // trigger CSS replace for existing tabs
    browser.tabs.query({
        url: TAB_FILTER_URLS
    }).then((tabs) => {
        return Promise.all(tabs.map(triggerCssOverwrite));
    }).then(() => {
        console.log("inserted content script into all pages");
    }).catch(console.error);
}

// register update for setting
BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.NEW_SETTING, async (request) => {
    console.log("Received new fakedColorStatus setting:", request.fakedColorStatus);

    // add new code injection and remove old one
    if (lastSettingsInjection) {
        (await lastSettingsInjection).unregister();
    }
    lastSettingsInjection = enableSettingInjection();
});
