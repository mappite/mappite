# Mappite 

Welcome to https://mappite.org GitHub repository. Mappite project is Open Source. Code is publicly available under GPL v3 license.

This page will grow with details to help volounteers providing feedback and enhancements. 

To build a local mappite environment (except internal routing) see [Build](./Build.md) 

Mappite functional discussions are on [Advrider.com](https://advrider.com/f/threads/mappite-org-create-routes-easily-feedback-wanted.1055040/) (English) and [Quellidellelica.com](quellidellelica.com/vbforums/showthread.php?t=433039) (Italian).

For technical/code issues or proposal use GitHub Issues.

### Files

Start looking at index.html and on the js files in mappite-js/ - these are collated in the `mappite.js` file which is the core component of the project.

### Mappite Routing 

Mappite can use OpenRouteService, Mapquest and Graphhopper as routing engines. Register on their project page to get the key to use - see [001-Keys.js](mappite-js/001-Keys.js).  The public https://mappite.org web site uses also a customized version of Graphhopper (currently for Europe).

The engine to use depends on some criterias - see `computeRoute()` in [100-Routing.js](mappite-js/100-Routing.js). 

### Map Layers

Mappite uses Leaflet to display map tiles (map images) from different providers, first option is (OSM)[https://openstreetmap.org] - see [030-Map.js](mappite-js/030-Map.js).

### Database and php

Mappite uses a mysql database and a few php pages to generate short urls and to provide cloud functionalities (login, save route etc.) - see php/ and sql/ folder.

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
