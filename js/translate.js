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
  /* ---------- Pills (desktop ≥ lg) ---------- */
  var bar = document.createElement("div");
  bar.className = "langbar";

  function mkPill(label, onClick, id) {
    var b = document.createElement("button");
    if (id) b.id = id;
    b.type = "button";
    b.className = "btn btn-sm lang-btn";
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  var pillEN   = mkPill("English",  () => useGoogleLanguage("en"),     "btn-en");
  var pillZHTW = mkPill("繁體中文",   () => useGoogleLanguage("zh-TW"),  "btn-zh-tw");
  var pillZHCN = mkPill("简体中文",   () => {
    if (document.documentElement.getAttribute("data-china-mode") === "1") openBaiduTranspage();
    else useGoogleLanguage("zh-CN");
  }, "btn-zh-cn");

  bar.append(pillEN, pillZHTW, pillZHCN);

  /* ---------- Dropdown (mobile < lg) ---------- */
  var dropWrap = document.createElement("div");
  dropWrap.className = "dropdown langdrop";

  var toggle = document.createElement("button");
  toggle.className = "btn btn-sm dropdown-toggle";
  toggle.type = "button";
  toggle.setAttribute("data-bs-toggle", "dropdown");
  toggle.setAttribute("aria-expanded", "false");
  toggle.id = "langDropdownToggle";
  toggle.textContent = "Language"; // will be replaced with current short label

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

  var itemEN   = mkItem("English (EN)",     () => useGoogleLanguage("en"),    "item-en");
  var itemZHTW = mkItem("繁體中文 (繁)",      () => useGoogleLanguage("zh-TW"), "item-zh-tw");
  var itemZHCN = mkItem("简体中文 (简)",      () => {
    if (document.documentElement.getAttribute("data-china-mode") === "1") openBaiduTranspage();
    else useGoogleLanguage("zh-CN");
  }, "item-zh-cn");

  menu.append(itemEN, itemZHTW, itemZHCN);
  dropWrap.append(toggle, menu);

  /* ---------- Mount both UIs ---------- */
  mount.append(bar, dropWrap);

  /* ---------- Reflect active selection (Google mode) ---------- */
  function currentLang() {
    var val = getCookie("googtrans") || "";
    var m = /\/auto\/([^;]+)/.exec(val);
    return m ? m[1] : "en";
  }
  function setActive() {
    var cur = window.__GOOGLE_TRANSLATE_READY__ ? currentLang() : "en";
    [pillEN, pillZHTW, pillZHCN].forEach(b => b.classList.remove("active"));
    (cur === "zh-TW" ? pillZHTW : cur === "zh-CN" ? pillZHCN : pillEN).classList.add("active");

    // dropdown label uses short code
    var short = cur === "zh-TW" ? "繁" : cur === "zh-CN" ? "简" : "EN";
    toggle.textContent = short;
  }
  setActive();

  /* ---------- China mode: disable 繁體 & note users ---------- */
  var mo = new MutationObserver(function () {
    var china = document.documentElement.getAttribute("data-china-mode") === "1";
    pillZHTW.disabled = china;
    itemZHTW.classList.toggle("disabled", china);
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-china-mode"] });

  // Also update labels once Google finishes initializing (first load)
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
  // Your layout loads the navbar HTML into #google_translate_element within the menu.
  waitForEl("#google_translate_element", function (mount) {
    injectLanguageButtons(mount);
    loadGoogleAndMaybeFallback();
  });
});
