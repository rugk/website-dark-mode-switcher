import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";
import { COMMUNICATION_MESSAGE_SOURCE } from "/common/modules/data/BrowserCommunicationTypes.js";
import { isControllable } from "/common/modules/BrowserSettings/BrowserSettings.js";

const BADGE_BACKGROUND_COLOR = "rgba(48, 48, 48, 0)";
const BADGE_COLOR = ""; // = "auto"

// currently loaded setting
let fakedColorStatus;

// shorten API
const overrideContentColorScheme = browser.browserSettings.overrideContentColorScheme;

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
 * @returns {Promise}
 */
async function propagateNewSetting(newColorSetting) {
    const newSettingsMessage = {
        type: COMMUNICATION_MESSAGE_TYPE.NEW_SETTING,
        fakedColorStatus: newColorSetting,
        source: COMMUNICATION_MESSAGE_SOURCE.BROWSER_ACTION
    };

    const currentBrowserSetting = await overrideContentColorScheme.get({});
    console.log('current browser setting for overrideContentColorScheme:', currentBrowserSetting);

    if (!isControllable(currentBrowserSetting.levelOfControl)) {
        throw Error("Browser setting is not controllable.");
    }

    const couldBeModified = await overrideContentColorScheme.set({
        value: newColorSetting
    });

    if (!couldBeModified) {
        throw Error("Browser setting could not be modified.");
    }
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
            fakedColorStatus = "light";
        } else { // if = light
            fakedColorStatus = "dark";
        }

        await propagateNewSetting(fakedColorStatus).catch(console.error);
        adjustUserIndicator(fakedColorStatus);
        await AddonSettings.set("fakedColorStatus", fakedColorStatus).catch(console.error);
    });
    browser.browserAction.setBadgeTextColor({
        color: BADGE_COLOR
    });
    browser.browserAction.setBadgeBackgroundColor({
        color: BADGE_BACKGROUND_COLOR
    });

    overrideContentColorScheme.onChange.addListener(async (details) => {
        var currentValue = details.value;
        console.log('currentValue', currentValue);
        fakedColorStatus = currentValue;
        adjustUserIndicator(fakedColorStatus);
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
