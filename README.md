# Mappite 

Welcome to https://mappite.org GitHub repository. Mappite project is Open Source. Code is publicly available under GPL v3 license.

This page will grow with details to help volunteers providing feedback and enhancements. 

To build a local mappite environment (except internal routing) see [Build](./Build.md) 

Mappite functional discussions are on [Advrider.com](https://advrider.com/f/threads/mappite-org-create-routes-easily-feedback-wanted.1055040/) (English) and [Quellidellelica.com](quellidellelica.com/vbforums/showthread.php?t=433039) (Italian) forums.

For code issues or proposals use GitHub Issues.

### Files

Start with `index.html` and js files in `mappite-js/` - the latter gets collated in the `mappite.js` file which is the project core component.

### Mappite Routing 

Mappite can use OpenRouteService (ORS), Graphhopper and Mapquest as routing engines. Register on their project page to get the key to use them online - see [001-Keys.js](mappite-js/001-Keys.js) - or download and make your local install for ORS or Graphhopper. The public https://mappite.org web site uses an internal customized version of Graphhopper (for Europe) and the other engines depending on route options - see `computeRoute()` in [100-Routing.js](mappite-js/100-Routing.js). 

### Map Layers

Mappite uses Leaflet to display map tiles (map images) from different providers, first option is [OSM](https://openstreetmap.org) - see [030-Map.js](mappite-js/030-Map.js).

### Database and php

Mappite uses a mysql database and a few php pages to maintain short urls, provide cloud functionalities (login, save route etc.) and cache routing results - see `php/` and `sql/` folders and [140-Cloud.js](mappite-js/140-Cloud.js), the latter to check how the front end interacts with the php back-end.

### Todo

A lot goes here, starting from improving the code to better split model/logic/views and make it easier for others to contribute. Any suggestion is appreciated!

<!--
**mappite/mappite** is a ✨ _special_ ✨ repository because its `README.md` (this file) appears on your GitHub profile.

Here are some ideas to get you started:

- 🔭 I’m currently working on ...
- 🌱 I’m currently learning ...
- 👯 I’m looking to collaborate on ...
- 🤔 I’m looking for help with ...
- 💬 Ask me about ...
- 📫 How to reach me: ...
- 😄 Pronouns: ...
- ⚡ Fun fact: ...
-->
