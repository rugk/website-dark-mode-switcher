# Dark Mode Website Switcher <img align="right" height="200" width="200" src="src/icons/icon-dark.svg">

[![Mozilla Add-on version](https://img.shields.io/amo/v/dark-mode-website-switcher.svg)](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/?src=external-github-shield-downloads)  
[![Mozilla Add-on downloads](https://img.shields.io/amo/d/dark-mode-website-switcher.svg)](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/?src=external-github-shield-downloads)
[![Mozilla Add-on users](https://img.shields.io/amo/users/dark-mode-website-switcher.svg)](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/statistics/)
[![Mozilla Add-on stars](https://img.shields.io/amo/stars/dark-mode-website-switcher.svg)](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/reviews/)

This is a (Firefox) add-on (WebExtension) that lets you invert the website's color scheme by inverting/changing the [`prefers-color-scheme`](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-color-scheme) media feature of CSS without requiring you to change the whole system style setting.

Test websites:
* https://stuffandnonsense.co.uk/blog/redesigning-your-product-and-website-for-dark-mode
* https://webkit.org/
* https://pinafore.social/
* https://s.codepen.io/aardrian/debug/NmoQdN
* http://adrianroselli.com/
* https://emojipedia.org/
* https://bugzilla.mozilla.org/

This extension only works with modern Firefox v67 or higher, as this is the first version that supports this feature.

## Download

**[![Get it for Firefox!](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png)](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/?src=external-github-download)**

## Important limitations!

Note this is quite restricted in real-world usage.
If you just want to have dark pages (with a light system style), it will usually work fine, but everything else is hardly possible. Also there may be edge-cases, where things break. (But please report bugs, anyway. It's good to know what/if websites break.)
To improve this situation Firefox would need to get a proper API.

The technical story on why this is so hard to overwrite CSS like that in an add-on [is described on Stackoverflow by me](https://stackoverflow.com/a/55910185/5008962), but basically I needed extract the CSS manually and manually apply it afterwards. And it requires an not-so-easy JS overwrite needed, too, BTW…

That's why I've requested a [better API on Bugzilla](https://bugzilla.mozilla.org/show_bug.cgi?id=1547818) (feel free to upvote, if you want this, too!).

For this reason, the add-on is currently named “**Dark Website Forcer**”. This makes it more obvious to the user, that it _cannot force_ a light website.

## Contribute

You can easily get involved in this FLOSS project and any help is certainly appreciated. Here are some ideas:

* 📃 [Translate this add-on into multiple languages!](./CONTRIBUTING.md#translations)
* 🐛 [Fix some easy issues and get started in add-on development](CONTRIBUTING.md#coding) (or just try out the development version)
* 💡 [Or check out some other add-on issues](CONTRIBUTING.md#need-ideas) (or translate them).

Or, in any case, [support us by spreading the word!](./CONTRIBUTING.md#support-us) ❤️

If you want to find out how this add-on currently works on a technical level, [have a look at this Stackoverflow answer](https://stackoverflow.com/a/55910185/5008962). I've explained it there in detail.
