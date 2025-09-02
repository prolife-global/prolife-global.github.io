/* Multilingual: Google (global) + Baidu fallback (China)
   Requires an element with id="google_translate_element" in your navbar.
*/

/* Multilingual: Google (global) + Baidu fallback (China)
   Mounts into <div id="google_translate_element"> in your navbar.
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

/* ---------- Google init (called by Google's script) ---------- */
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
  } else {
    setCookie("googtrans", "/auto/" + lang, 365);
  }
  location.reload();
  return true;
}

function openBaiduTranspage() {
  var url = "https://fanyi.baidu.com/transpage?query=" + encodeURIComponent(location.href)
          + "&from=auto&to=zh&source=web&render=1";
  location.href = url;
}

/* ---------- Always-on Bootstrap dropdown UI ---------- */
function injectLanguageButtons(mount) {
  var dropWrap = document.createElement("div");
  dropWrap.className = "dropdown langdrop";

  var toggle = document.createElement("button");
  toggle.className = "btn btn-sm dropdown-toggle";
  toggle.type = "button";
  toggle.setAttribute("data-bs-toggle", "dropdown");
  toggle.setAttribute("aria-expanded", "false");
  toggle.id = "langDropdownToggle";
  toggle.textContent = "🌐 EN"; // will update after init

  var menu = document.createElement("ul");
  menu.className = "dropdown-menu dropdown-menu-end";
  menu.setAttribute("aria-labelledby", "langDropdownToggle");

  function mkItem(label, onClick, id) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.className = "dropdown-item";
    if (id) a.id = id;
    a.href = "#";
    a.textContent = label;
    a.addEventListener("click", function(e){ e.preventDefault(); onClick(); });
    li.appendChild(a);
    return li;
  }

  var itemEN   = mkItem("English (EN)", () => useGoogleLanguage("en"),    "item-en");
  var itemZHTW = mkItem("繁體中文 (繁)",  () => useGoogleLanguage("zh-TW"), "item-zh-tw");
  var itemZHCN = mkItem("简体中文 (简)",  () => {
    if (document.documentElement.getAttribute("data-china-mode") === "1") openBaiduTranspage();
    else useGoogleLanguage("zh-CN");
  }, "item-zh-cn");

  menu.append(itemEN, itemZHTW, itemZHCN);
  dropWrap.append(toggle, menu);
  mount.appendChild(dropWrap);

  function currentLang() {
    var val = getCookie("googtrans") || "";
    var m = /\/auto\/([^;]+)/.exec(val);
    return m ? m[1] : "en";
  }
  function setActive() {
    var cur = window.__GOOGLE_TRANSLATE_READY__ ? currentLang() : "en";
    toggle.textContent = "🌐 " + (cur === "zh-TW" ? "繁" : cur === "zh-CN" ? "简" : "EN");
  }
  setActive();

  // China mode: disable 繁體中文 item
  var mo = new MutationObserver(function () {
    var china = document.documentElement.getAttribute("data-china-mode") === "1";
    itemZHTW.classList.toggle("disabled", china);
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-china-mode"] });

  // Update once Google finishes initializing on first load
  if (!window.__GOOGLE_TRANSLATE_READY__) {
    var readyInt = setInterval(function(){
      if (window.__GOOGLE_TRANSLATE_READY__) { clearInterval(readyInt); setActive(); }
    }, 200);
  }
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
  // Your menu injects <div id="google_translate_element" class="ms-2"></div> into the navbar.
  waitForEl("#google_translate_element", function (mount) {
    injectLanguageButtons(mount);
    loadGoogleAndMaybeFallback();
  });
});
