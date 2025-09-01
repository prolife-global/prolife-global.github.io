/* Multilingual: Google (global) + Baidu fallback (China)
   Requires an element with id="google_translate_element" in your navbar.
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

/* ---------- UI next to Google widget (Bootstrap pills) ---------- */
function injectLanguageButtons(mount) {
  var wrap = document.createElement("div");
  wrap.className = "langbar";

  function mk(label, onClick, id) {
    var b = document.createElement("button");
    b.textContent = label;
    if (id) b.id = id;
    b.type = "button";
    b.className = "btn btn-sm lang-btn";
    b.addEventListener("click", onClick);
    return b;
  }

  var btnEN   = mk("English", () => useGoogleLanguage("en"), "btn-en");
  var btnZHTW = mk("繁體中文", () => useGoogleLanguage("zh-TW"), "btn-zh-tw");
  var btnZHCN = mk("简体中文", () => {
    if (document.documentElement.getAttribute("data-china-mode") === "1") openBaiduTranspage();
    else useGoogleLanguage("zh-CN");
  }, "btn-zh-cn");

  var badge = document.createElement("span");
  badge.id = "china-badge";
  badge.textContent = "China mode";

  wrap.append(btnEN, btnZHTW, btnZHCN, badge);
  mount.appendChild(wrap);

  // Reflect active (Google mode) by reading googtrans cookie
  if (window.__GOOGLE_TRANSLATE_READY__) {
    var val = getCookie("googtrans") || "";
    var m = /\/auto\/([^;]+)/.exec(val);
    var current = m ? m[1] : "en";
    (current === "en" ? btnEN : current === "zh-TW" ? btnZHTW : btnZHCN).classList.add("active");
  }

  // Disable zh-TW visually + show badge when in China mode
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
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
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
  // Your layout loads the navbar HTML into #google_translate_element within the menu.
  waitForEl("#google_translate_element", function (mount) {
    injectLanguageButtons(mount);
    loadGoogleAndMaybeFallback();
  });
});
