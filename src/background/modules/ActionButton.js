import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";
import { COMMUNICATION_MESSAGE_SOURCE } from "/common/modules/data/BrowserCommunicationTypes.js";

import * as CssAnalysis from "./CssAnalysis.js";

const TAB_FILTER_URLS = ["<all_urls>"];

const BADGE_BACKGROUND_COLOR = "rgba(48, 48, 48, 0)";
const BADGE_COLOR = ""; // = "auto"

// currently loaded setting
let fakedColorStatus;

/**
 * Load the current status of the option.
 *
 * @function
 * @private
 * @returns {Promise}
 */
async function loadOption() {
    fakedColorStatus = await AddonSettings.get("fakedColorStatus");
}

/**
 * Adjust the indicator that shows to the user whether the dark mode is enabled
 * or not.
 *
 * @function
 * @private
 * @param  {boolean} newColorSetting
 * @returns {void}
 */
function adjustUserIndicator(newColorSetting) {
    let badgeText;
    if (newColorSetting === "dark") {
        badgeText = browser.i18n.getMessage("badgeDark");
    } else { // if = light
        badgeText = browser.i18n.getMessage("badgeLight");
    }

    browser.browserAction.setBadgeText({
        text: badgeText
    });
}

/**
 * Send message to other parts of add-on to apply new setting.
 *
 * @function
 * @private
 * @param  {string} newColorSetting
 * @returns {void}
 */
function propagateNewSetting(newColorSetting) {
    const newSettingsMessage = {
        type: COMMUNICATION_MESSAGE_TYPE.NEW_SETTING,
        fakedColorStatus: newColorSetting,
        source: COMMUNICATION_MESSAGE_SOURCE.BROWSER_ACTION
    };

    // reinject new setting
    CssAnalysis.injectContentScript(fakedColorStatus);

    // send to all tabs
    browser.tabs.query({
        url: TAB_FILTER_URLS
    }).then((tabs) => {
        return Promise.all(tabs.map((tab) => {
            browser.tabs.sendMessage(tab.id, newSettingsMessage);
        }));
    });

    // send to own background script
    browser.runtime.sendMessage(newSettingsMessage);
}

/**
 * Init module.
 *
 * And bind to clicks on toolbar button, so you can quickly trigger the dark mode.
 *
 * @function
 * @returns {void}
 */
export async function init() {
    await loadOption();

    browser.browserAction.onClicked.addListener(async () => {
        if (fakedColorStatus === "dark") {
            fakedColorStatus = "no_overwrite";
        } else { // if = light
            fakedColorStatus = "dark";
        }

        propagateNewSetting(fakedColorStatus);
        adjustUserIndicator(fakedColorStatus);
        await AddonSettings.set("fakedColorStatus", fakedColorStatus);
    });
    browser.browserAction.setBadgeTextColor({
        color: BADGE_COLOR
    });
    browser.browserAction.setBadgeBackgroundColor({
        color: BADGE_BACKGROUND_COLOR
    });

    // receive new setting changed by settingspage
    BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.NEW_SETTING, (request) => {
        // prevent same triggering by blacklisting same source
        if (request.source === COMMUNICATION_MESSAGE_SOURCE.BROWSER_ACTION) {
            return;
        }

        fakedColorStatus = request.fakedColorStatus;
        adjustUserIndicator(fakedColorStatus);
    });

    adjustUserIndicator(fakedColorStatus);
}
