const TAB_FILTER_URLS = ["http://*/*", "https://*/*"];

/**
 * Inserts content script.
 *
 * @private
 * @param {Object} tab
 * @returns {void}
 */
async function insertContentScript(tab) {
    // first inject pointer to let content script know in which tab
    // it is running

    await browser.tabs.executeScript(tab.id, {
        code: `const MY_TAB_ID = ${tab.id}`,
        allFrames: true,
        runAt: "document_end"
    });

    return browser.tabs.executeScript(tab.id, {
        file: "/content_scripts/applyDarkMode.js",
        allFrames: true,
        runAt: "document_end"
    });
}

/**
 * Init module.
 *
 * @function
 * @returns {void}
 */
export function init() {
    // inject in all tabs that we have permission for
    browser.tabs.query({
        url: TAB_FILTER_URLS
    }).then((tabs) => {
        return Promise.all(tabs.map(insertContentScript));
    }).then(() => {
        console.log("inserted content script into all pages");
    }).catch(console.error);

    // listen to new tabs
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
        if (changeInfo.status === "complete") {
            console.log("insert content script now that status is complete");
            return insertContentScript(tabInfo);
        }
        return Promise.reject(new Error("not a completed tab load, ignoring it"));
    }, {
        urls: TAB_FILTER_URLS
    }).then(() => {
        console.log("inserted content script into newly created tab");
    });
}
