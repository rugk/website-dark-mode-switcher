import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

const TAB_FILTER_URLS = ["<all_urls>"];
let lastSettingsInjection = null;

AddonSettings.setCaching(false);

/**
 * Triggers the new setting in case it has been changed.
 *
 * @public
 * @returns {Promise}
 */
export async function triggerNewColorStatus() {
    // add new code injection and remove old one
    if (lastSettingsInjection) {
        (await lastSettingsInjection).unregister();
    }
    lastSettingsInjection = await enableSettingInjection();
}

/**
 * Adds a content script that is injected by Firefox and provides the preloaded
 * value of fakedColorStatus.
 *
 * @private
 * @returns {Promise}
 */
async function enableSettingInjection() {
    const functionalMode = await AddonSettings.get("functionalMode");
    const fakedColorStatus = await AddonSettings.get("fakedColorStatus");

    return browser.contentScripts.register({
        matches: TAB_FILTER_URLS,
        js: [{
            code: `
                    ${setSettings.toString()}
                    setSettings(${functionalMode}, "${fakedColorStatus.toUpperCase()}");
                `,
        }],
        allFrames: true,
        matchAboutBlank: true,
        runAt: "document_start"
    });
}

/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */
/**
 * Sets the settings inside of the content script.
 *
 * **Important:** Execute this *only* inside of the content script.
 *
 * @private
 * @param {bool} functionalModeNew
 * @param {string} fakedColorStatusNewString
 * @returns {void}
 */
function setSettings(functionalModeNew, fakedColorStatusNewString) {
    functionalMode = functionalModeNew;
    // apply settings value if COLOR_STATUS is defined = common.js is loaded
    if (COLOR_STATUS) {
        fakedColorStatus = COLOR_STATUS[fakedColorStatusNewString];
        console.log("setSettings(): new settings applied:", functionalMode, fakedColorStatusNewString);
    } else {
        // in case the common.js is not loaded yet retry setting value
        console.log("setSettings(): COLOR_STATUS is not defined yet, try setting settings again in 100ms");
        setTimeout(() => {
            setSettings(functionalMode, fakedColorStatusNewString);
        }, 100);
    }
}
/* eslint-enable no-undef */
/* eslint-enable no-unused-expressions */

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
    lastSettingsInjection = await enableSettingInjection();

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

    return triggerNewColorStatus();
});
BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.NEW_ADDIONAL_SETTINGS, (request) => {
    console.info("Received new NEW_ADDIONAL_SETTINGS setting:", request);

    return triggerNewColorStatus();
});
