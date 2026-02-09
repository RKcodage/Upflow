/* eslint-disable */
(function () {
  var DEFAULTS = {
    projectId: null,
    projectKey: null,
    siteOrigin: null,
    position: "bottom-right", // "bottom-right" | "bottom-left"
    theme: "dark", // "dark" | "light"
    accent: null, // "#6b59d7"
    baseUrl: null, // e.g. "https://your-upflow-domain.com"
  };

  var state = {
    initialized: false,
    config: DEFAULTS,
    button: null,
    iframe: null,
    isOpen: false,
    origin: null,
    messageHandler: null,
    keyHandler: null,
  };

  function getScriptBaseUrl() {
    try {
      var el = document.currentScript;
      if (!el) {
        var scripts = document.getElementsByTagName("script");
        el = scripts[scripts.length - 1];
      }
      if (el && el.src) return new URL(el.src, document.baseURI).origin;
    } catch (_) {}
    return null;
  }

  function mergeConfig(next) {
    var merged = {};
    for (var k in DEFAULTS) merged[k] = DEFAULTS[k];
    for (var k2 in state.config) merged[k2] = state.config[k2];
    for (var k3 in next) merged[k3] = next[k3];

    if (!merged.baseUrl) merged.baseUrl = getScriptBaseUrl();
    state.origin = merged.baseUrl;
    state.config = merged;
  }

  function ensureButton() {
    if (state.button) return state.button;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "Ouvrir UpFlow");
    btn.style.position = "fixed";
    btn.style.bottom = "24px";
    btn.style.width = "60px";
    btn.style.height = "60px";
    btn.style.borderRadius = "999px";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.boxShadow = "0 8px 30px rgba(107, 89, 215, 0.35)";
    btn.style.zIndex = "2147483646";
    btn.style.background =
      "linear-gradient(135deg, " +
      (state.config.accent || "#6b59d7") +
      ", " +
      (state.config.accent || "#6b59d7") +
      ")";

    if (state.config.position === "bottom-left") btn.style.left = "24px";
    else btn.style.right = "24px";

    btn.addEventListener("mouseenter", function () {
      btn.style.transform = "scale(1.08)";
    });
    btn.addEventListener("mouseleave", function () {
      btn.style.transform = "scale(1)";
    });
    btn.addEventListener("click", function () {
      open();
    });

    btn.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M8 9h8M8 13h6M21 12c0 4.418-4.03 8-9 8-1.186 0-2.318-.186-3.351-.523L3 20l1.26-4.2A7.4 7.4 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>";

    document.body.appendChild(btn);
    state.button = btn;
    return btn;
  }

  function buildEmbedUrl() {
    if (!state.config.baseUrl) {
      throw new Error("UpFlow: baseUrl not found. Provide UpFlow.init({ baseUrl: 'https://...' }).");
    }

    var url = new URL(state.config.baseUrl.replace(/\/$/, "") + "/embed");
    if (state.config.projectId) url.searchParams.set("projectId", state.config.projectId);
    if (state.config.projectKey) url.searchParams.set("projectKey", state.config.projectKey);
    var siteOrigin = state.config.siteOrigin;
    if (!siteOrigin) siteOrigin = window.location.origin;
    if (siteOrigin) url.searchParams.set("siteOrigin", siteOrigin);
    if (state.config.theme) url.searchParams.set("theme", state.config.theme);
    if (state.config.accent) url.searchParams.set("accent", state.config.accent);
    return url.toString();
  }

  function ensureIframe() {
    if (state.iframe) return state.iframe;

    var iframe = document.createElement("iframe");
    iframe.setAttribute("title", "UpFlow Widget");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.inset = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.background = "transparent";
    iframe.style.zIndex = "2147483647";
    iframe.style.display = "none";
    iframe.src = buildEmbedUrl();

    document.body.appendChild(iframe);
    state.iframe = iframe;
    return iframe;
  }

  function onMessage(event) {
    if (!state.origin) return;
    try {
      var expectedOrigin = new URL(state.origin).origin;
      if (event.origin !== expectedOrigin) return;
    } catch (_) {
      return;
    }

    var data = event.data || {};
    if (data.type === "UPFLOW_CLOSE") close();
  }

  function open() {
    ensureButton();
    var iframe = ensureIframe();

    var nextSrc = buildEmbedUrl();
    if (iframe.src !== nextSrc) iframe.src = nextSrc;
    iframe.style.display = "block";
    state.button.style.display = "none";
    state.isOpen = true;
  }

  function close() {
    if (!state.iframe || !state.button) return;
    state.iframe.style.display = "none";
    state.button.style.display = "flex";
    state.isOpen = false;
  }

  function destroy() {
    if (state.messageHandler) window.removeEventListener("message", state.messageHandler);
    if (state.keyHandler) window.removeEventListener("keydown", state.keyHandler);
    if (state.button && state.button.parentNode) state.button.parentNode.removeChild(state.button);
    if (state.iframe && state.iframe.parentNode) state.iframe.parentNode.removeChild(state.iframe);
    state.initialized = false;
    state.button = null;
    state.iframe = null;
    state.isOpen = false;
    state.messageHandler = null;
    state.keyHandler = null;
  }

  function init(config) {
    mergeConfig(config || {});

    ensureButton();
    var iframe = ensureIframe();
    var nextSrc = buildEmbedUrl();
    if (iframe.src !== nextSrc) iframe.src = nextSrc;

    if (!state.messageHandler) {
      state.messageHandler = onMessage;
      window.addEventListener("message", state.messageHandler);
    }

    if (!state.keyHandler) {
      state.keyHandler = function (event) {
        if (event.key === "Escape" && state.isOpen) close();
      };
      window.addEventListener("keydown", state.keyHandler);
    }

    state.initialized = true;
  }

  window.UpFlow = window.UpFlow || {};
  window.UpFlow.init = init;
  window.UpFlow.open = open;
  window.UpFlow.close = close;
  window.UpFlow.destroy = destroy;
})();
