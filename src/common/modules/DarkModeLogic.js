import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import { isControllable } from "/common/modules/BrowserSettings/BrowserSettings.js";

/**
 * A simplified API callback providing the result of the about:config setting.
 *
 * @async
 * @callback changeTrigger
 * @param {string} value the new value
 * @return {void}
 */

/**
 * @type {changeTrigger[]}
 */
const onChangeCallbacks = [];

/**
 * Switch the dark mode
 *
 * @returns {Promise}
 */
export async function toggleDarkMode() {
    const currentBrowserSetting = await getCurrentState();
    let newBrowserSetting = "";
    if (currentBrowserSetting === "dark") {
        newBrowserSetting = "light";
    } else { // if = light
        newBrowserSetting = "dark";
    }

    await applySetting(newBrowserSetting);
}

/**
 * Return the currently used option.
 *
 * @returns {Promise<string>}
 */
export async function getCurrentState() {
    // TODO: implement optional syncing!
    // const shouldBeSynced = await AddonSettings.get("shouldBeSynced");

    // if (shouldBeSynced) {
    //     const currentBrowserSetting = (await browser.browserSettings.overrideContentColorScheme.get({})).value;
    //     const syncedSetting = await AddonSettings.get("fakedColorStatus");
    //     if (currentBrowserSetting !== syncedSetting) {
    //         await applySetting(syncedSetting);
    //     }
    // }

    // reload the setting from browser again as that is the safer value to rely on
    return (await browser.browserSettings.overrideContentColorScheme.get({})).value;
}

/**
 * Apply the provided style.
 *
 * @param {string} newOption
 * @returns {Promise}
 * @throws {Error}
 */
export async function applySetting(newOption) {
    const currentBrowserSetting = await browser.browserSettings.overrideContentColorScheme.get({});
    console.log("current browser setting for overrideContentColorScheme:", currentBrowserSetting);

    if (!isControllable(currentBrowserSetting.levelOfControl)) {
        throw Error("Browser setting is not controllable.");
    }

    const couldBeModified = await browser.browserSettings.overrideContentColorScheme.set({
        value: newOption
    });

    if (!couldBeModified) {
        throw Error("Browser setting could not be modified.");
    }

    await AddonSettings.set("fakedColorStatus", newOption);
}

/**
 * Register a callback for any changed value.
 *
 * @param {changeTrigger} callback
 * @returns {void}
 */
export function registerChangeListener(callback) {
    onChangeCallbacks.push(callback);
}

/**
 * Handle any change to the browser setting value and trigger registered callbacks.
 *
 * @private
 * @param {Object} details
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/types/BrowserSetting/onChange}
 * @returns {void}
 */
function internalTriggerHandler(details) {
    const currentValue = details.value;
    onChangeCallbacks.forEach((callback) => callback(currentValue));
}

/**
 * Register the internal handler ({@link internalTriggerHandler)}) for handling changes to the browser setting.
 *
 * @private
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/types/BrowserSetting/onChange}
 * @returns {void}
 */
function registerBrowserListener() {
    browser.browserSettings.overrideContentColorScheme.onChange.addListener(internalTriggerHandler);
}

/**
 * Unregister the internal handler ({@link internalTriggerHandler)}) to ignore any changes to the browser setting.
 *
 * @private
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/types/BrowserSetting/onChange}
 * @returns {void}
 */
function unregisterBrowserListener() {
    browser.browserSettings.overrideContentColorScheme.onChange.removeListener(internalTriggerHandler);
}

// automatically init itself as fast as possible
registerBrowserListener();
