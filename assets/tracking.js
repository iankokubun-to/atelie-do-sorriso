(function () {
  "use strict";
  var storageKey = "atelie_attribution_v1";
  var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "gbraid", "wbraid", "fbclid", "campaignid", "adgroupid", "creative", "keyword", "matchtype", "device"];
  var params = new URLSearchParams(window.location.search);
  var current = {};
  keys.forEach(function (key) {
    var value = params.get(key);
    if (value) current[key] = value.slice(0, 180);
  });

  var previous = {};
  try { previous = JSON.parse(window.localStorage.getItem(storageKey) || "{}"); } catch (_) {}
  var firstTouch = previous.first_touch || Object.assign({
    landing_path: window.location.pathname,
    referrer: document.referrer || "direct",
    captured_at: new Date().toISOString()
  }, current);
  var lastTouch = Object.assign({
    landing_path: window.location.pathname,
    referrer: document.referrer || previous.last_touch && previous.last_touch.referrer || "direct",
    captured_at: new Date().toISOString()
  }, previous.last_touch || {}, current);
  var attribution = { first_touch: firstTouch, last_touch: lastTouch };
  try { window.localStorage.setItem(storageKey, JSON.stringify(attribution)); } catch (_) {}

  window.dataLayer = window.dataLayer || [];
  var pageType = document.body.getAttribute("data-page") || "site";
  var pipeleadUrl = document.body.getAttribute("data-pipelead") || "";
  window.dataLayer.push(Object.assign({ event: "view_landing", landing_type: pageType }, lastTouch));

  document.querySelectorAll("a[data-cta]").forEach(function (link) {
    if (pipeleadUrl) link.href = pipeleadUrl;
    link.addEventListener("click", function () {
      var targetUrl;
      try { targetUrl = new URL(link.href); } catch (_) {}
      window.dataLayer.push(Object.assign({
        event: "click_cta",
        event_id: "cta-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
        landing_type: pageType,
        cta_location: link.getAttribute("data-cta") || "unspecified",
        cta_text: (link.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
        link_url: link.href,
        link_domain: targetUrl ? targetUrl.hostname : "",
        pipelead_link: !!(targetUrl && targetUrl.hostname === "go.pipelead.to"),
        page_path: window.location.pathname
      }, lastTouch));
    });
  });

  document.querySelectorAll("details[data-faq]").forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) window.dataLayer.push({ event: "open_faq", landing_type: pageType, faq: item.querySelector("summary").textContent.trim().slice(0, 120) });
    });
  });

  var halfwaySent = false;
  window.addEventListener("scroll", function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (!halfwaySent && max > 0 && window.scrollY / max >= 0.5) {
      halfwaySent = true;
      window.dataLayer.push({ event: "scroll_50", landing_type: pageType });
    }
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    var sectionEvents = { tratamentos: "view_treatment", opcoes: "view_treatment", processo: "view_steps" };
    var seen = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var eventName = sectionEvents[entry.target.id];
        if (entry.isIntersecting && eventName && !seen[eventName]) {
          seen[eventName] = true;
          window.dataLayer.push({ event: eventName, landing_type: pageType });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    Object.keys(sectionEvents).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  window.AtelieAttribution = attribution;
})();
