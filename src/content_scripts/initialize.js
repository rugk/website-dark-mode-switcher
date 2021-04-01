/**
 * Initialize various pieces of the content script
 */
"use strict";

/* eslint-disable no-unused-vars */

/* globals initializeUpdateRequest, initializeApplyColorSchemeCss, initializeApplyColorSchemeJs */
/* globals functionalMode:writable, fakedColorStatus:writable, COLOR_STATUS */

/**
 * Initial settings at document-start, will be filled by a dynamic content script
 * Using "var" here because of Temporal Dead Zone
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz}
 */
// eslint-disable-next-line no-var
var initialSettings;

let alreadyInitialized = false;

/**
 * Initialize content scripts
 *
 * @public
 * @param {Object} settings 
 * @returns {void}
 */
function initializeContentScripts(settings) {
    if (alreadyInitialized) {
        return;
    }
    alreadyInitialized = true;

    functionalMode = settings.functionalMode;

    // ATTENTION: hardcoded default value here!
    const newSetting = settings.fakedColorStatus || "dark";

    fakedColorStatus = COLOR_STATUS[newSetting.toUpperCase()];

    initializeApplyColorSchemeJs();
    initializeApplyColorSchemeCss();
    initializeUpdateRequest();
}

if (typeof initialSettings !== "undefined") {
    initializeContentScripts(initialSettings);
}

/* eslint-enable no-unused-vars */
