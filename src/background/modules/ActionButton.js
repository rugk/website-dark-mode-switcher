import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

const TAB_FILTER_URLS = ["http://*/*", "https://*/*"];

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
 * @param  {boolean} newColorSetting
 * @returns {void}
 */
function propagateNewSetting(newColorSetting) {
    const newSettingsMessage = {
        type: COMMUNICATION_MESSAGE_TYPE.NEW_SETTING,
        fakedColorStatus: newColorSetting
    };

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

    browser.browserAction.onClicked.addListener(() => {
        if (fakedColorStatus === "dark") {
            fakedColorStatus = "no_overwrite";
        } else { // if = light
            fakedColorStatus = "dark";
        }

        propagateNewSetting(fakedColorStatus);
        adjustUserIndicator(fakedColorStatus);
    });
    browser.browserAction.setBadgeTextColor({
        color: BADGE_COLOR
    });
    browser.browserAction.setBadgeBackgroundColor({
        color: BADGE_BACKGROUND_COLOR
    });

    adjustUserIndicator(fakedColorStatus);
}
