"use strict";

/* eslint-disable no-global-assign */
// settings injection
/* globals fakedColorStatus, functionalMode */ // eslint-disable-line no-unused-vars

// other parts of add-on
/* globals COLOR_STATUS, applyJsOverwrite, applyWantedStyle */

const NEW_SETTING = "newSetting";
const NEW_SETTING_ADDITIONAL = "newSettingAdditional";

/**
 * Process a message send by another part of the add-on.
 *
 * @function
 * @param {Object} request
 * @returns {void}
 */
function processMessage(request) {
    switch (request.type) {
    case NEW_SETTING:
        // adjust setting
        fakedColorStatus = COLOR_STATUS[request.fakedColorStatus.toUpperCase()]; // eslint-disable-line no-unused-vars

        // trigger functions
        applyJsOverwrite(); // actually does not need to be retriggered, as the JS-overwrite does not need to be recreated
        applyWantedStyle();
        break;
    case NEW_SETTING_ADDITIONAL:
        functionalMode = request.functionalMode;

        // trigger functions
        applyWantedStyle();
        break;
    default:
        console.warn("[dark-website-forcer] error: unknown communication request received, ignoring:", request);
    }
}

// add listener for incoming messages
browser.runtime.onMessage.addListener(processMessage);
