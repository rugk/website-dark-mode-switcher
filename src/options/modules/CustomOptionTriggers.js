/**
 * This modules contains the custom triggers for some options that are added.
 *
 * @module modules/CustomOptionTriggers
 */

import * as AutomaticSettings from "/common/modules/AutomaticSettings/AutomaticSettings.js";
import * as CommonMessages from "/common/modules/MessageHandler/CommonMessages.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

const TAB_FILTER_URLS = ["http://*/*", "https://*/*"];

/**
 * Send message to other parts of add-on to apply new setting.
 *
 * @function
 * @private
 * @param  {boolean} optionValue
 * @param  {string} [option]
 * @returns {void}
 */
function applyFakedColorStatus(optionValue) {
    const newSettingsMessage = {
        type: COMMUNICATION_MESSAGE_TYPE.NEW_SETTING,
        fakedColorStatus: optionValue
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

    // show warning for rarely used values
    if (optionValue === "light" || optionValue === "no_preference") {
        CommonMessages.showInfo("optionWarningRareStyleSetting");
    } else {
        CommonMessages.hideInfo();
    }
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

    // handle loading of options correctly
    AutomaticSettings.Trigger.registerAfterLoad(AutomaticSettings.Trigger.RUN_ALL_SAVE_TRIGGER);
}
