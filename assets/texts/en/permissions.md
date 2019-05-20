# Requested permissions

For a general explanation of add-on permission see [this support article](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Installation permissions

| Internal Id | Permission                     | Explanation                                                   |
|:------------|:-------------------------------|:--------------------------------------------------------------|
| `tabs`      | Read the text of all open tabs | Needed injecting the new (dark) style into all existing tabs. |

## Hidden permissions

Additionally it requests these permission, which are not requested in Firefox when the add-on is installed, as they are not a serious permission.

| Internal Id  | Permission                        | Explanation                                      |
|:-------------|:----------------------------------|:-------------------------------------------------|
| `storage`    | Access local storage              | Needed for saving options                        |
| `<all_urls>` | Access your data for all websites | Needed injecting the new (dark) style into tabs. |
