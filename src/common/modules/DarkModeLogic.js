import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import { isControllable } from "/common/modules/BrowserSettings/BrowserSettings.js";

const darkColorSchemeMediaQuery = "(prefers-color-scheme: dark)";
let isListening = false;

/**
 * A simplified API callback providing the result of the about:config setting.
 *
 * @async
 * @callback changeTrigger
 * @param {string} value the new value
 * @return {void}
 */

/**
 * A map of all possible color schemes supported by the API.
 *
 * @const
 * @type {Object.<string, string|null>}
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/browserSettings/overrideContentColorScheme}
 */
export const COLOR_OVERRIDE = Object.freeze({
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system",
    BROWSER: "browser",
    NULL: null
});

/**
 * @type {changeTrigger[]}
 */
const onChangeCallbacks = [];

/**
 * Switch the dark mode from on to off or inverse.
 *
 * @returns {Promise}
 */
export async function toggleDarkMode() {
    AddonSettings.loadOptions();
    const darkModeVariant = await AddonSettings.get("darkModeVariant");
    const lightModeVariant = await AddonSettings.get("lightModeVariant");

    let currentBrowserSetting = await getCurrentState();

    let newBrowserSetting = "";
    if (currentBrowserSetting === COLOR_OVERRIDE.DARK ||
        currentBrowserSetting === darkModeVariant) {
        newBrowserSetting = lightModeVariant;
    } else { // if = COLOR_OVERRIDE.LIGHT
        newBrowserSetting = darkModeVariant;
    }

    await applySetting(newBrowserSetting);
}

/**
 * Return the currently used design.
 *
 * @returns {string}
 */
export async function getCurrentDesign() {
    // need to temporarily clean override to get "real" value
    const oldOverride = await getCurrentBrowserOverride();
    applySetting(null);
    const isDarkMode = window.matchMedia(darkColorSchemeMediaQuery).matches;
    applySetting(oldOverride);

    if (isDarkMode) {
        return COLOR_OVERRIDE.DARK;
    } else {
        return COLOR_OVERRIDE.LIGHT;
    }
}

/**
 * Return the currently used option.
 *
 * If the clever mode is enabled, this returns the current design.
 *
 * @returns {Promise<string>}
 */
export async function getCurrentState() {
    // TODO: implement optional syncing!
    // const shouldBeSynced = await AddonSettings.get("shouldBeSynced");

    // if (shouldBeSynced) {
    //     const currentBrowserSetting = (await browser.browserSettings.overrideContentColorScheme.get({})).value;
    //     const syncedSetting = await AddonSettings.get("prefersColorSchemeOverride");
    //     if (currentBrowserSetting !== syncedSetting) {
    //         await applySetting(syncedSetting);
    //     }
    // }

    const cleverDarkMode = await AddonSettings.get("cleverDarkMode");

    if (cleverDarkMode) {
        return getCurrentDesign();
    } else {
        // reload the setting from browser again as that is the safer value to rely on
        return getCurrentBrowserOverride();
    }
}

/**
 * Return the currently used browser override (by this addon).
 *
 * @returns {Promise<string>}
 */
export async function getCurrentBrowserOverride() {
    return (await browser.browserSettings.overrideContentColorScheme.get({})).value;
}

/**
 * Apply the provided style.
 *
 * A value of "null", given as a string or literal, resets the setting, so other extensions or similar can override it.
 *
 * @param {string|null} newOption of COLOR_OVERRIDE
 * @returns {Promise}
 * @throws {Error}
 */
export async function applySetting(newOption) {
    const currentBrowserSetting = await browser.browserSettings.overrideContentColorScheme.get({});
    console.log("current browser setting for overrideContentColorScheme:", currentBrowserSetting);

    if (!isControllable(currentBrowserSetting.levelOfControl)) {
        throw new Error("Browser setting is not controllable.");
    }

    // temporarily unregister listeners to prevend endless loop
    unregisterBrowserListener();

    let couldBeModified;
    if (newOption === "null" || newOption === null) {
        couldBeModified = await browser.browserSettings.overrideContentColorScheme.clear({});
    } else {
        couldBeModified = await browser.browserSettings.overrideContentColorScheme.set({
            value: newOption
        });
    }

    // re-register after some time
    setTimeout(() => {
        registerBrowserListener();
    }, 1000);

    if (!couldBeModified) {
        throw Error("Browser setting could not be modified.");
    }

    const cleverDarkMode = await AddonSettings.get("cleverDarkMode");
    // do not save setting if interactive clever dark mode is used
    if (!cleverDarkMode) {
        await AddonSettings.set("prefersColorSchemeOverride", newOption);
    }
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
 * Handle any change to the browser setting value and trigger registered callbacks.
 *
 * @private
 * @param {MediaQueryList} mediaQueryList
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/addListener}
 * @returns {void}
 */
async function internalTriggerHandlerForVisibilityChange(mediaQueryList) {
    const currentValue = await getCurrentDesign();
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
    if (isListening) {
        console.warn("Dark mode listener is listening already, no need to register.");
        return;
    }

    const cleverDarkMode = AddonSettings.get("cleverDarkMode");

    if (cleverDarkMode) {
        // TODO: switch to new EventListener API
        // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
        const darkModeQueryList = window.matchMedia(darkColorSchemeMediaQuery);
        darkModeQueryList.addListener(internalTriggerHandlerForVisibilityChange);
    } else {
        browser.browserSettings.overrideContentColorScheme.onChange.addListener(internalTriggerHandler);
    }

    isListening = true;
}

/**
 * Unregister the internal handler ({@link internalTriggerHandler)}) to ignore any changes to the browser setting.
 *
 * @private
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/types/BrowserSetting/onChange}
 * @returns {void}
 */
function unregisterBrowserListener() {
    if (!isListening) {
        console.warn("Dark mode listener is not listening already, no need to unregister.");
        return;
    }

    browser.browserSettings.overrideContentColorScheme.onChange.removeListener(internalTriggerHandler);

    const darkModeQueryList = window.matchMedia(darkColorSchemeMediaQuery);
    darkModeQueryList.removeListener(internalTriggerHandlerForVisibilityChange);

    isListening = false;
}

// automatically init itself as fast as possible
registerBrowserListener();
