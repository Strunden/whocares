/* Who Cares runtime config.
   base: null keeps relative links working on / and /whocares/.
   API_BASE: Worker origin, no trailing slash. When set, the site loads
   {API_BASE}/api/index and falls back to data/index.json if that fails.
   Leave API_BASE as "" to use only data/index.json. */
window.WHOCARES_CONFIG = {
  base: null,
  API_BASE: "https://whocares-api.mrstrunden.workers.dev",
};
