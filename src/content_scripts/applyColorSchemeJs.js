/**
 * Applying the color's JS.
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList}
 */

"use strict";

const ADDON_FAKED_WARNING = "MediaQueryList has been faked by add-on website-dark-mode-switcher; see https://github.com/rugk/website-dark-mode-switcher/. If it causes any problems, please open an issue.";
let loggedFakedWarning = false;

// instances of `MediaQueryList`s with listeners
const setMediaQueryLists = new Set();

// func -> { hook, setMediaQueryList, setMediaQueryListOnChange }
const weakmapFuncToEntry = new WeakMap();

// hook -> func
const weakmapHookToFunc = new WeakMap();

const privilegedOnChangeGetter = Reflect.getOwnPropertyDescriptor(MediaQueryList.prototype, "onchange").get;

const MediaQueryListPrototype = MediaQueryList.prototype.wrappedJSObject;
const originalAddListener = MediaQueryListPrototype.addListener;
const originalRemoveListener = MediaQueryListPrototype.removeListener;
const originalMatchesGetter = Reflect.getOwnPropertyDescriptor(MediaQueryListPrototype, "matches").get;
const originalOnChangeGetter = Reflect.getOwnPropertyDescriptor(MediaQueryListPrototype, "onchange").get;
const originalOnChangeSetter = Reflect.getOwnPropertyDescriptor(MediaQueryListPrototype, "onchange").set;

const EventTargetPrototype = window.EventTarget.prototype.wrappedJSObject;
const originalAddEventListener = EventTargetPrototype.addEventListener;
const originalRemoveEventListener = EventTargetPrototype.removeEventListener;

// ugly juggling principals
const unsafeObjectCreate = window.wrappedJSObject.Object.create;

// Whether we are dispatching "change" events
let dispatching = false;

// last setting seen by js
let lastSeenJsColorStatus = null;

/* globals COLOR_STATUS, MEDIA_QUERY_COLOR_SCHEME, MEDIA_QUERY_PREFER_COLOR, fakedColorStatus, getSystemMediaStatus */

// eslint does not include X-Ray vision functions, see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
/* globals exportFunction */

/**
 * Returns the COLOR_STATUS for a media query string.
 *
 * @private
 * @param {string} mediaQueryString
 * @returns {COLOR_STATUS|null}
 */
function getColorTypeFromMediaQuery(mediaQueryString) {
    // to avoid expensive RegEx, first use a simple check
    if (!hasColorMediaQuery(mediaQueryString)) {
        return null;
    }

    if (MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.LIGHT].test(mediaQueryString)) {
        return COLOR_STATUS.LIGHT;
    } else if (MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.DARK].test(mediaQueryString)) {
        return COLOR_STATUS.DARK;
    } else if (MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.NO_PREFERENCE].test(mediaQueryString)) {
        return COLOR_STATUS.NO_PREFERENCE;
    } else {
        return null;
    }
}

/**
 * Whether a string contains media query for color scheme
 *
 * @private
 * @param {string} mediaQueryString
 * @returns {boolean}
 */
function hasColorMediaQuery(mediaQueryString) {
    return (mediaQueryString.includes(MEDIA_QUERY_COLOR_SCHEME));
}

/**
 * Evaluate a media query string.
 * Returns null if the query has nothing to do with color.
 *
 * @private
 * @param {string} mediaQueryString
 * @returns {boolean|null}
 */
function evaluateMediaQuery(mediaQueryString) {
    if (fakedColorStatus === COLOR_STATUS.NO_OVERWRITE) {
        return matchMedia(mediaQueryString).matches;
    }

    const requestedMedia = getColorTypeFromMediaQuery(mediaQueryString);
    if (requestedMedia === null) {
        return null;
    }

    return (fakedColorStatus === requestedMedia);
}

/**
 * Keep track of listener addition
 * Creates hook function if necessary
 *
 * @private
 * @param {function} listener original listener
 * @param {MediaQueryList} mediaQueryList
 * @param {boolean} isOnChange
 * @returns {function} hook
 */
function trackOnListener(listener, mediaQueryList, isOnChange) {
    const entry = weakmapFuncToEntry.get(listener);

    let hook, setMediaQueryList, setMediaQueryListOnChange;
    if (!entry) {
        hook = makeListenerHook(listener);
        setMediaQueryList = new Set();
        setMediaQueryListOnChange = new Set();
        weakmapFuncToEntry.set(listener, {
            hook: hook,
            setMediaQueryList: setMediaQueryLists,
            setMediaQueryListOnChange: setMediaQueryListOnChange
        });
        weakmapHookToFunc.set(hook, listener);
    } else {
        hook = entry.hook;
        setMediaQueryList = entry.setMediaQueryList;
        setMediaQueryListOnChange = entry.setMediaQueryListOnChange;
    }

    if (isOnChange) {
        setMediaQueryListOnChange.add(mediaQueryList);
    } else {
        setMediaQueryList.add(mediaQueryList);
    }

    setMediaQueryLists.add(mediaQueryList);

    return hook;
}

/**
 * Keep track of listener removal
 * Returns hook function or null if not found
 *
 * @private
 * @param {function} listener original listener
 * @param {MediaQueryList} mediaQueryList
 * @param {boolean} isOnChange
 * @returns {function} hook
 */
function trackOffListener(listener, mediaQueryList, isOnChange) {
    const entry = weakmapFuncToEntry.get(listener);
    if (!entry) {
        return null;
    }

    const hook = entry.hook;
    const setMediaQueryList = entry.setMediaQueryList;
    const setMediaQueryListOnChange = entry.setMediaQueryListOnChange;

    if (isOnChange) {
        setMediaQueryListOnChange.delete(mediaQueryList);
    } else {
        setMediaQueryList.delete(mediaQueryList);
    }

    if (setMediaQueryList.size === 0 && setMediaQueryListOnChange.size === 0) {
        setMediaQueryLists.delete(mediaQueryList);
    }

    return hook;
}

/**
 * Check if an object is a MediaQueryList
 * The correctness of this relies on Firefox's XPCNativeWrapper
 *
 * @private
 * @param {function} obj
 * @returns {boolean}
 */
function checkIsMediaQueryList(obj) {
    return (Object.prototype.toString.call(obj) === "[object MediaQueryList]");
}

/* eslint-disable prefer-rest-params, no-setter-return */

/**
 * Kludge "skeleton" to make exportFunction()-ed .name and .toString() as expected.
 * such as "get onchange", "set onchange".
 */
const skeleton = {
    addListener(func) {
        if (!checkIsMediaQueryList(this) ||
            typeof func !== "function" ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalAddListener, this, arguments);
        }
        const hook = trackOnListener(func, this, false);
        return Reflect.apply(originalAddListener, this, [hook]);
    },
    removeListener(func) {
        if (!checkIsMediaQueryList(this) ||
            typeof func !== "function" ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalRemoveListener, this, arguments);
        }
        const hook = trackOffListener(func, this, false);
        if (!hook) {
            return Reflect.apply(originalRemoveListener, this, arguments);
        }
        return Reflect.apply(originalRemoveListener, this, [hook]);
    },
    get matches() {
        if (!checkIsMediaQueryList(this) ||
            fakedColorStatus === COLOR_STATUS.NO_OVERWRITE
        ) {
            return Reflect.apply(originalMatchesGetter, this, arguments);
        }
        const result = evaluateMediaQuery(this.media);
        if (result === null) {
            return Reflect.apply(originalMatchesGetter, this, arguments);
        }
        mayLogFakeWarning();
        return result;
    },
    get onchange() {
        if (!checkIsMediaQueryList(this) ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalOnChangeGetter, this, arguments);
        }
        const hook = Reflect.apply(privilegedOnChangeGetter, this, arguments);
        if (typeof hook !== "function") {
            return hook;
        }
        const func = weakmapHookToFunc.get(hook);
        if (typeof func !== "function") {
            console.error('[website-dark-mode-switcher] someone called "get onchange" on an unknown MediaQueryList!');
            return null;
        }
        return func;
    },
    set onchange(func) {
        if (!checkIsMediaQueryList(this) ||
            typeof func !== "function" ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalOnChangeSetter, this, arguments);
        }
        const oldHook = Reflect.apply(privilegedOnChangeGetter, this, arguments);
        if (typeof oldHook === "function") {
            const oldFunc = weakmapHookToFunc.get(oldHook);
            if (typeof oldFunc !== "function") {
                console.error('[website-dark-mode-switcher] someone called "set onchange" on an unknown MediaQueryList!');
                // eslint-disable-next-line consistent-return
                return;
            }
            trackOffListener(oldFunc, this, true);
        }
        const hook = trackOnListener(func, this, true);
        return Reflect.apply(originalOnChangeSetter, this, [hook]);
    },

    addEventListener(type, listener /* , options*/) {
        if (!checkIsMediaQueryList(this) ||
            type !== "change" ||
            typeof listener !== "function" ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalAddEventListener, this, arguments);
        }
        const options = arguments[2];
        const hook = trackOnListener(listener, this, false);
        return Reflect.apply(originalAddEventListener, this, ["change", hook, options]);
    },
    removeEventListener(type, listener /* , options*/) {
        if (!checkIsMediaQueryList(this) ||
            type !== "change" ||
            typeof listener !== "function" ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalRemoveEventListener, this, arguments);
        }
        const options = arguments[2];
        const hook = trackOffListener(listener, this, false);
        if (!hook) {
            return Reflect.apply(originalRemoveEventListener, this, arguments);
        }
        return Reflect.apply(originalRemoveEventListener, this, ["change", hook, options]);
    }
};

/**
 * Make a hook function for "change" event listener
 *
 * @private
 * @param {function} listener the original listener function
 * @returns {function}
 */
function makeListenerHook(listener) {
    const dummy = unsafeObjectCreate(null);
    return exportFunction(function(event) {
        if (Object.prototype.toString.call(event) !== "[object MediaQueryListEvent]" ||
            fakedColorStatus === COLOR_STATUS.NO_OVERWRITE
        ) {
            return Function.prototype.apply.call(listener, this, arguments);
        }

        if (!dispatching && event.isTrusted) {
            // swallow events originating from the browser
            mayLogFakeWarning();
            // eslint-disable-next-line consistent-return
            return;
        }

        return Function.prototype.apply.call(listener, this, arguments);
    }, dummy, {
        defineAs: listener.name
    });
}

/* eslint-enable prefer-rest-params, no-setter-return */

/**
 * Dispatch artificial "change" events
 *
 * @private
 * @returns {void}
 */
function dispatchChangeEvents() {
    if (fakedColorStatus === COLOR_STATUS.NO_OVERWRITE) {
        const systemMediaStatus = getSystemMediaStatus();
        if (lastSeenJsColorStatus === systemMediaStatus) {
            return;
        } else {
            lastSeenJsColorStatus = systemMediaStatus;
        }
    } else if (lastSeenJsColorStatus === fakedColorStatus) {
        return;
    } else {
        lastSeenJsColorStatus = fakedColorStatus;
    }

    // [CAVEAT]
    // In vanilla Firefox, events are dispatched to `MediaQueryList`s in the order they are created.
    // Since there is no way to keep track of the order of all `MediaQueryList`s without memory leaks,
    // we are calling them in the order they are assigned listeners.
    dispatching = true;
    for (const mediaQueryList of setMediaQueryLists) {
        const result = evaluateMediaQuery(mediaQueryList.media);
        if (result === null) {
            continue;
        }
        mayLogFakeWarning();
        // [CAVEAT]
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1348213
        // WebExtensions have no way of generating trusted events
        const event = new MediaQueryListEvent("change", {
            media: mediaQueryList.media,
            matches: result
        });
        mediaQueryList.dispatchEvent(event);
    }
    dispatching = false;
}

/**
 * Logs ADDON_FAKED_WARNING if not already did
 *
 * @private
 * @returns {void}
 */
function mayLogFakeWarning() {
    if (!loggedFakedWarning) {
        console.log(ADDON_FAKED_WARNING);
        loggedFakedWarning = true;
    }
}

/* eslint-disable no-unused-vars */

/**
 * Do things on settings change
 *
 * @public
 * @returns {void}
 */
function applyNewSettingsJs() {
    dispatchChangeEvents();
}

/**
 * Initialize applyColorSchemeJs.js
 *
 * @public
 * @returns {void}
 */
function initializeApplyColorSchemeJs() {
    if (fakedColorStatus === COLOR_STATUS.NO_OVERWRITE) {
        lastSeenJsColorStatus = getSystemMediaStatus();
    } else {
        lastSeenJsColorStatus = fakedColorStatus;
    }

    Reflect.defineProperty(MediaQueryListPrototype, "addListener", {
        configurable: true,
        enumerable: true,
        value: exportFunction(skeleton.addListener, window),
        writable: true
    });
    Reflect.defineProperty(MediaQueryListPrototype, "removeListener", {
        configurable: true,
        enumerable: true,
        value: exportFunction(skeleton.removeListener, window),
        writable: true
    });
    const descriptorMatches = Reflect.getOwnPropertyDescriptor(skeleton, "matches");
    Reflect.defineProperty(MediaQueryListPrototype, "matches", {
        configurable: true,
        enumerable: true,
        get: exportFunction(descriptorMatches.get, window)
    });
    const descriptorOnchange = Reflect.getOwnPropertyDescriptor(skeleton, "onchange");
    Reflect.defineProperty(MediaQueryListPrototype, "onchange", {
        configurable: true,
        enumerable: true,
        get: exportFunction(descriptorOnchange.get, window),
        set: exportFunction(descriptorOnchange.set, window),
    });

    Reflect.defineProperty(EventTargetPrototype, "addEventListener", {
        configurable: true,
        enumerable: true,
        value: exportFunction(skeleton.addEventListener, window),
        writable: true
    });
    Reflect.defineProperty(EventTargetPrototype, "removeEventListener", {
        configurable: true,
        enumerable: true,
        value: exportFunction(skeleton.removeEventListener, window),
        writable: true
    });
}

/* eslint-enable no-unused-vars */
