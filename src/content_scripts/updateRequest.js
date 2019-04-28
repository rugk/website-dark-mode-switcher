"use strict";

/* eslint-disable no-global-assign */
/* globals fakedColorStatus */ // eslint-disable-line no-unused-vars

// other parts of add-on
/* globals COLOR_STATUS, applyJsOverwrite, applyWantedStyle */

const NEW_SETTING = "newSetting";

// TODO: dead code, currently

/**
 * Process a message send by another part of the add-on.
 *
 * @function
 * @param {Object} request
 * @returns {void}
 */
function processMessage(request) {
    // ignore unrelated requests
    if (request.type !== NEW_SETTING) {
        return;
    }

    // adjust setting
    fakedColorStatus = COLOR_STATUS[request.fakedColorStatus.toUpperCase()]; // eslint-disable-line no-unused-vars

    // trigger functions
    applyJsOverwrite(); // actually does not need to be retriggered, as the JS-overwrite does not need to be recreated
    applyWantedStyle();
}

// add listener for incoming messages
browser.runtime.onMessage.addListener(processMessage);
