import * as DarkModeLogic from "/common/modules/DarkModeLogic.js";

const BADGE_BACKGROUND_COLOR = "rgba(48, 48, 48, 0)";
const BADGE_COLOR = null; // = "auto"

/**
 * Adjust the indicator that shows to the user whether the dark mode is enabled
 * or not.
 *
 * @function
 * @private
 * @param  {string} newColorSetting
 * @returns {void}
 */
export function adjustUserIndicator(newColorSetting) {
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
 * Init module.
 *
 * And bind to clicks on toolbar button, so you can quickly trigger the dark mode.
 *
 * @function
 * @returns {void}
 */
export function init() {
    DarkModeLogic.getCurrentState().then((newSetting) => {
        adjustUserIndicator(newSetting);
    });

    DarkModeLogic.registerChangeListener((currentValue) => {
        adjustUserIndicator(currentValue);
    });

    browser.browserAction.onClicked.addListener(() => {
        return DarkModeLogic.toggleDarkMode().catch(console.error);
    });

    // static design
    browser.browserAction.setBadgeTextColor({
        color: BADGE_COLOR
    });
    browser.browserAction.setBadgeBackgroundColor({
        color: BADGE_BACKGROUND_COLOR
    });
}


