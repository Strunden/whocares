/* Who Cares runtime config.
   base: null detects the path from js/app.js, so both / and /whocares/ work.
         Set a string to force it, for example "" or "/whocares".
   api:  "auto" tries {base}/api/index, then site/data/index.json.
         "off" uses only the JSON file (no API request).
         A full origin such as "https://example.com" calls that host, then falls back to JSON.
   GitHub Pages has no Neon routes. Leave api on "auto" or set "off".
   Point api at a separate host when DATABASE_URL is set there. */
window.WHOCARES_CONFIG = {
  base: null,
  api: "auto",
};
