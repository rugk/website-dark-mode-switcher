/**
 * This modules contains the custom triggers for some options that are added.
 *
 * @module modules/CustomOptionTriggers
 */

import * as AutomaticSettings from "/common/modules/AutomaticSettings/AutomaticSettings.js";
import * as CustomMessages from "/common/modules/MessageHandler/CustomMessages.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";
import { COMMUNICATION_MESSAGE_SOURCE } from "/common/modules/data/BrowserCommunicationTypes.js";

const TAB_FILTER_URLS = ["http://*/*", "https://*/*"];
const MESSAGE_POSSIBLY_BROKEN_SETTING_STYLE = "optionWarningRareStyleSetting";

/**
 * Applies the dark mode setting.
 *
 * @function
 * @private
 * @param  {string} optionValue
 * @param  {string} [option]
 * @returns {void}
 */
function applyFakedColorStatus(optionValue) {
    // show warning for rarely used values
    if (optionValue === "light" || optionValue === "no_preference") {
        CustomMessages.showMessage(MESSAGE_POSSIBLY_BROKEN_SETTING_STYLE, "optionWarningRareStyleSetting", false);
    } else {
        CustomMessages.hideMessage(MESSAGE_POSSIBLY_BROKEN_SETTING_STYLE, {animate: true});
    }

    const newSettingsMessage = {
        type: COMMUNICATION_MESSAGE_TYPE.NEW_SETTING,
        fakedColorStatus: optionValue,
        source: COMMUNICATION_MESSAGE_SOURCE.SETTINGS_PAGE
    };
    console.log("Options page send new option", newSettingsMessage);

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
 * Applies the functional mode setting.
 *
 * @function
 * @private
 * @param  {boolean} optionValue
 * @param  {string} [option]
 * @returns {void}
 */
function applyFunctionalMode(optionValue) {
    const newSettingsMessage = {
        type: COMMUNICATION_MESSAGE_TYPE.NEW_ADDIONAL_SETTINGS,
        functionalMode: optionValue,
        source: COMMUNICATION_MESSAGE_SOURCE.SETTINGS_PAGE
    };

    // send to all tabs
    browser.tabs.query({
        url: TAB_FILTER_URLS
    }).then((tabs) => {
        return Promise.all(tabs.map((tab) => {
            browser.tabs.sendMessage(tab.id, newSettingsMessage);
        }));
    });
    browser.runtime.sendMessage(newSettingsMessage);
}

/**
 * Binds the triggers.
 *
 * This is basically the "init" method.
 *
 * @function
 * @returns {void}
 */
export function registerTrigger() {
    AutomaticSettings.Trigger.registerSave("fakedColorStatus", applyFakedColorStatus);
    AutomaticSettings.Trigger.registerSave("functionalMode", applyFunctionalMode);

    CustomMessages.registerMessageType(MESSAGE_POSSIBLY_BROKEN_SETTING_STYLE, document.getElementById("messageWarningRareStyleSetting"));

    // handle loading of options correctly
    AutomaticSettings.Trigger.registerAfterLoad(AutomaticSettings.Trigger.RUN_ALL_SAVE_TRIGGER);

    // receive new setting changed by browserAction
    BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.NEW_SETTING, (request) => {
        console.info("Received new fakedColorStatus setting:", request.fakedColorStatus);
        // prevent infinite loop by blacklisting same source
        // This is currently no problkem, as changing the option does not retrigger the triggers registered above, but
        // included for security reasons anyway.
        if (request.source === COMMUNICATION_MESSAGE_SOURCE.SETTINGS_PAGE) {
            return;
        }

        console.info("Apply new fakedColorStatus setting to options page:", request.fakedColorStatus);

        document.getElementById("fakedColorStatus").value = request.fakedColorStatus;
    });

}
