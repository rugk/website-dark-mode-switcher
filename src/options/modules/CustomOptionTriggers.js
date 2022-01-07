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
function applyPrefersColorSchemeOverride(optionValue) {
    return DarkModeLogic.applySetting(optionValue);
}

/**
 * Apply the setting and show it as the used one.
 *
 * @param {string} currentSetting The setting to show as the currently selected one.
 * @returns {void}
 */
function applySetting(currentSetting) {
    const newColorSettingInput = document.getElementById("prefersColorSchemeOverride");
    newColorSettingInput.value = currentSetting;
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
    AutomaticSettings.Trigger.registerSave("prefersColorSchemeOverride", applyPrefersColorSchemeOverride);

    // handle loading of options correctly
    AutomaticSettings.Trigger.registerAfterLoad(AutomaticSettings.Trigger.RUN_ALL_SAVE_TRIGGER);

    DarkModeLogic.registerChangeListener(applySetting);
    DarkModeLogic.getCurrentState().then((currentSetting) => {
        applySetting(currentSetting);
    });
}
