# Mappite 

Welcome to https://mappite.org GitHub repository. Mappite project is Open Source. Code is publicly available under GPL v3 license.

This page will grow with details to help volounteers providing feedback and enhancements. 

To build a local mappite environment (except internal routing) see [Build](./Build.md) 

### Files

Here goes an high level description of files in `src/` directory. Start looking at index.html and on the js files in mappite-js/ which are then collated in the mappite.js file which is the core component of the project.

### Mappite Routing 

Mappite can use OpenRouteService, Mapquest and Graphhopper as routing engines. Register on their project page to get the key to use [001-Keys.js](mappite-js/001-Keys.js).  The public https://mappite.org web site uses also a customized version of Graphhopper (currently for Europe).

The engine to use depends on some criterias - see `computeRoute()` in [100-Routing.js](mappite-js/100-Routing.js). 

### Map Layers

Mappite uses Leaflet to display map tiles (map images) at different zoom levels. 

### Database and php

Mappite uses a mysql database and a few php pages to generate short urls and to provide cloud functionalities (login, save route etc.).

### Todo

A lot goes here, starting from improving code to better split model/logic/views and make it easier for others to contribute. Any suggestion is appreciated.

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
