/**
 * This modules contains the custom triggers for some options that are added.
 *
 * @module modules/CustomOptionTriggers
 */

import * as AutomaticSettings from "/common/modules/AutomaticSettings/AutomaticSettings.js";
import * as DarkModeLogic from "/common/modules/DarkModeLogic.js";

/**
 * Applies the dark mode setting.
 *
 * @function
 * @private
 * @param  {string} optionValue
 * @param  {string} [option]
 * @returns {Promise}
 */
function applyFakedColorStatus(optionValue) {
    return DarkModeLogic.applySetting(optionValue);
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
