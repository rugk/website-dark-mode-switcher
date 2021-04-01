"use strict";

/* eslint-disable no-global-assign */
// settings injection
/* globals fakedColorStatus, functionalMode */ // eslint-disable-line no-unused-vars

// other parts of add-on
/* globals COLOR_STATUS, applyNewSettingsJs, applyWantedStyle */

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
        applyNewSettingsJs();
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

/* eslint-disable no-unused-vars */

/**
 * Initialize updateRequest.js
 *
 * @public
 * @returns {void}
 */
function initializeUpdateRequest() {
    // add listener for incoming messages
    browser.runtime.onMessage.addListener(processMessage);
}

/* eslint-enable no-unused-vars */
