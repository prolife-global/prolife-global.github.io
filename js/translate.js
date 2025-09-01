// Use this file to add JavaScript to your project


/* Multilingual: Google (global) + Baidu fallback (China)
   Requires an element with id="google_translate_element" in your navbar.
   Your menu already has it, so we mount there. :contentReference[oaicite:0]{index=0}
*/

/* ---------- tiny helpers ---------- */
function waitForEl(sel, cb, t = 0) {
  const el = document.querySelector(sel);
  if (el) cb(el);
  else if (t < 8000) setTimeout(() => waitForEl(sel, cb, t + 100), 100);
}

function setCookie(n, v, d) {
  try {
    var e = "";
    if (d) {
      var dt = new Date();
      dt.setTime(dt.getTime() + d * 864e5);
      e = "; expires=" + dt.toUTCString();
    }
    document.cookie = n + "=" + (v || "") + e + "; path=/";
    var parts = location.hostname.split(".");
    if (parts.length > 2) {
      var parent = parts.slice(-2).join(".");
      document.cookie = n + "=" + (v || "") + e + "; domain=." + parent + "; path=/";
    }
  } catch (_) {}
}
function getCookie(n) {
  var s = n + "=", a = document.cookie.split(";");
  for (var i = 0; i < a.length; i++) {
    var c = a[i].trim();
    if (c.indexOf(s) === 0) return c.substring(s.length);
  }
  return null;
}

/* ---------- Google init (called by Google’s script) ---------- */
function googleTranslateElementInit() {
  try {
    new google.translate.TranslateElement({
      pageLanguage: "en",
      includedLanguages: "en,zh-TW,zh-CN",
      autoDisplay: false
    }, "google_translate_element");
    window.__GOOGLE_TRANSLATE_READY__ = true;
  } catch (e) {}
}
window.googleTranslateElementInit = googleTranslateElementInit;

/* ---------- Switchers ---------- */
function useGoogleLanguage(lang) {
  if (!window.__GOOGLE_TRANSLATE_READY__) return false;
  if (lang === "en") {
    setCookie("googtrans", "/auto/en", 365);
    location.reload();
    return true;
  }
  setCookie("googtrans", "/auto/" + lang, 365);
  location.reload();
  return true;
}

function openBaiduTranspage() {
  var url = "https://fanyi.baidu.com/transpage?query=" + encodeURIComponent(location.href)
          + "&from=auto&to=zh&source=web&render=1";
  location.href = url;
}

/* ---------- UI next to Google widget ---------- */
function injectLanguageButtons(mount) {
  var wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.gap = "8px";
  wrap.style.alignItems = "center";

  function mk(label, onClick, id) {
    var b = document.createElement("button");
    b.textContent = label;
    if (id) b.id = id;
    b.type = "button";
    b.style.cssText =
      "border:1px solid #2a3e61;background:#101a2c;color:#e7ecf3;padding:6px 10px;border-radius:10px;cursor:pointer";
    b.onclick = onClick;
    return b;
  }

  var btnEN   = mk("English",    () => useGoogleLanguage("en"),    "btn-en");
  var btnZHTW = mk("繁體中文",     () => useGoogleLanguage("zh-TW"), "btn-zh-tw");
  var btnZHCN = mk("简体中文",     () => {
    if (document.documentElement.getAttribute("data-china-mode") === "1") openBaiduTranspage();
    else useGoogleLanguage("zh-CN");
  }, "btn-zh-cn");

  var badge = document.createElement("span");
  badge.textContent = "China mode";
  badge.style.cssText = "display:none;font-size:12px;color:#ffd18b;margin-left:6px";
  badge.id = "china-badge";

  wrap.append(btnEN, btnZHTW, btnZHCN, badge);
  mount.appendChild(wrap);

  // Reflect active (Google mode)
  if (window.__GOOGLE_TRANSLATE_READY__) {
    var val = getCookie("googtrans") || "";
    var m = /\/auto\/([^;]+)/.exec(val);
    var current = m ? m[1] : "en";
    var activeBtn = current === "en" ? btnEN : current === "zh-TW" ? btnZHTW : btnZHCN;
    activeBtn.style.boxShadow = "0 0 0 3px rgba(106,166,255,.35)";
  }

  // Disable zh-TW when in China mode
  var obs = new MutationObserver(function () {
    var china = document.documentElement.getAttribute("data-china-mode") === "1";
    btnZHTW.disabled = china;
    badge.style.display = china ? "inline" : "none";
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-china-mode"] });
}

/* ---------- Load Google + fallback to China mode ---------- */
function loadGoogleAndMaybeFallback() {
  var s = document.createElement("script");
  s.src =
    (location.protocol === "https:" ? "https:" : "http:") +
    "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  s.referrerPolicy = "no-referrer-when-downgrade";
  document.head.appendChild(s);

  var FALLBACK_MS = 2500;
  setTimeout(function () {
    if (!window.__GOOGLE_TRANSLATE_READY__) {
      document.documentElement.setAttribute("data-china-mode", "1");
      setCookie("googtrans", "/auto/en", 1);
    } else {
      document.documentElement.removeAttribute("data-china-mode");
    }
  }, FALLBACK_MS);
}

/* ---------- Bootstrap after the menu gets injected ---------- */
document.addEventListener("DOMContentLoaded", function () {
  // Your layout loads the navbar HTML into #menu-placeholder, so we wait for the mount point. :contentReference[oaicite:1]{index=1}
  waitForEl("#google_translate_element", function (mount) {
    injectLanguageButtons(mount);
    loadGoogleAndMaybeFallback();
  });
});
