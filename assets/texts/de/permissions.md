# Erfragte Berechtigungen

Für eine allgemeine Erklärung von Add-on-Berechtigungen siehe [diesen Support-Artikel]https://support.mozilla.org/de/kb/berechtigungsdialoge-der-firefox-erweiterungen).

## Berechtigungen bei Installation

| Internal Id | Permission                                 | Explanation                                                                 |
|:------------|:-------------------------------------------|:----------------------------------------------------------------------------|
| `tabs`      | Auf Ihre Daten für alle Websites zugreifen | Benötigt, um das (dunkle) Design in die existierenden Webseiten einzufügen. |

## Versteckte Berechtigungen

Zusätzlich verlangt dieses Add-on folgende Berechtigungen, welche in Firefox aber nicht abgefragt werden, da sie keine tiefgreifenden Berechtigungen sind.

| Interne ID   | Berechtigung                           | Erklärung                                                     |
|:-------------|:---------------------------------------|:--------------------------------------------------------------|
| `storage`    | Zugriff auf lokalen Speicher           | Benötigt um Einstellungen abzuspeichern                       |
| `<all_urls>` | Auf Texte aller offenen Tabs zugreifen | Benötigt, um das (dunkle) Design in die Webseiten einzufügen. |
