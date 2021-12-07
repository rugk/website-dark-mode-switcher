/**
 * Upgrades user data on installation of new updates.
 *
 * Attention: Currently you must not include this script asyncronously. See
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1506464 for details.
 *
 * @module InstallUpgrade
 */

import { COLOR_OVERRIDE } from "/common/modules/DarkModeLogic.js";

/**
 * Upgrades the user data if required.
 *
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled}
 * @private
 * @param {Object} details
 * @returns {Promise}
 */
async function handleInstalled(details) {
    // only trigger for usual addon updates
    if (details.reason !== "update") {
        return;
    }

    switch (details.previousVersion) {
    case "1.2":
    case "1.3": {
        console.log(`Doing upgrade from ${details.previousVersion}.`, details);

        const oldData = await browser.storage.sync.get();

        let oldColorScheme = oldData.fakedColorStatus;
        switch (oldColorScheme) {
        case "no_preference":
        case "no_overwrite":
            oldColorScheme = COLOR_OVERRIDE.SYSTEM;
            break;
        }

        await browser.storage.sync.set({
            prefersColorSchemeOverride: oldColorScheme,
        });
        await browser.storage.sync.remove(["fakedColorStatus", "functionalMode"]);

        console.info("Data upgrade successful.", await browser.storage.sync.get());
        break;
    }
    default:
        console.log(`Addon upgrade from ${details.previousVersion}. No data upgrade needed.`, details);
    }
}

/**
 * Inits module.
 *
 * @private
 * @returns {void}
 */
function init() {
    browser.runtime.onInstalled.addListener(handleInstalled);
}

init();
