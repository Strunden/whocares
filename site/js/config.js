/* Who Cares runtime config.
   base: null keeps relative links working on / and /whocares/.
   API_BASE: Required canonical database service. No local data fallback. */
window.WHOCARES_CONFIG = {
  base: null,
  API_BASE: "https://whocares-api.mrstrunden.workers.dev",
  // Set a public PostHog project key only after configuring the EU project.
  ANALYTICS: { enabled: false, projectKey: "" },
};
