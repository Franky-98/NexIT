/* NexIT Solutions, comportamenti della pagina.
   Nessuna libreria: tema chiaro/scuro, menu laterale, orologio del pannello,
   scelta del profilo con calcolo dei prezzi e modulo di prova. */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- tema chiaro / scuro ---------- */

  var THEME_KEY = "nexit-theme";

  function readTheme() {
    try { return window.localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function writeTheme(value) {
    try { window.localStorage.setItem(THEME_KEY, value); } catch (e) { /* ignora */ }
  }
  function currentTheme() {
    var explicit = root.getAttribute("data-theme");
    if (explicit === "dark" || explicit === "light") return explicit;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  var saved = readTheme();
  if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);

  var themeBtn = document.getElementById("theme");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      writeTheme(next);
    });
  }

  /* ---------- barra superiore, menu laterale, scrollspy ---------- */

  var menu = document.getElementById("menu");
  var menuBtn = document.getElementById("menu-toggle");
  var scrim = document.getElementById("scrim");
  var drawerMq = window.matchMedia ? window.matchMedia("(max-width: 900px)") : null;

  function onScroll() {
    root.classList.toggle("scrolled", (window.scrollY || window.pageYOffset) > 4);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open, restoreFocus) {
    if (!menu || !menuBtn) return;
    root.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    if (open) {
      var first = menu.querySelector("a");
      if (first && drawerMq && drawerMq.matches) first.focus();
    } else if (restoreFocus) {
      menuBtn.focus();
    }
  }

  if (menu && menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(!root.classList.contains("menu-open"), true);
    });
    if (scrim) scrim.addEventListener("click", function () { setMenu(false, true); });
    menu.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest("a")) setMenu(false, false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && root.classList.contains("menu-open")) setMenu(false, true);
    });
    if (drawerMq) {
      var closeOnWide = function () { if (!drawerMq.matches) setMenu(false, false); };
      if (drawerMq.addEventListener) drawerMq.addEventListener("change", closeOnWide);
      else if (drawerMq.addListener) drawerMq.addListener(closeOnWide);
    }
  }

  /* voce di menu attiva in base alla sezione visibile */
  var navItems = Array.prototype.slice.call(document.querySelectorAll(".nav-item"));
  var spyTargets = [];
  navItems.forEach(function (a) {
    var id = (a.getAttribute("href") || "").replace("#", "");
    var el = id && document.getElementById(id);
    if (el) spyTargets.push({ id: id, el: el, link: a });
  });

  function updateSpy() {
    var line = window.innerHeight * 0.35;
    var current = null;
    spyTargets.forEach(function (t) {
      if (t.el.getBoundingClientRect().top <= line) current = t;
    });
    spyTargets.forEach(function (t) {
      if (t === current) t.link.setAttribute("aria-current", "true");
      else t.link.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", updateSpy, { passive: true });
  window.addEventListener("resize", updateSpy);
  updateSpy();

  /* pulsante flottante: compare dopo l'introduzione, sparisce sul modulo */
  var fab = document.getElementById("fab");
  var hero = document.querySelector(".hero") || document.querySelector("main > section");
  var contacts = document.getElementById("contatti");

  function updateFab() {
    if (!fab) return;
    var heroGone = hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 400;
    var atContacts = contacts ? contacts.getBoundingClientRect().top < window.innerHeight * 0.6 : false;
    fab.classList.toggle("show", heroGone && !atContacts);
  }
  window.addEventListener("scroll", updateFab, { passive: true });
  window.addEventListener("resize", updateFab);
  updateFab();

  /* ---------- snackbar ---------- */

  var snack = document.getElementById("snackbar");
  var snackText = document.getElementById("snack-text");
  var snackClose = document.getElementById("snack-close");
  var snackTimer = null;

  function hideSnack() {
    if (!snack) return;
    snack.classList.remove("show");
    root.classList.remove("snack-open");
    window.clearTimeout(snackTimer);
  }
  function showSnack(text) {
    if (!snack || !snackText) return;
    snackText.textContent = text;
    snack.classList.add("show");
    root.classList.add("snack-open");
    window.clearTimeout(snackTimer);
    snackTimer = window.setTimeout(hideSnack, 6000);
  }
  if (snackClose) snackClose.addEventListener("click", hideSnack);

  /* ---------- effetto onda al tocco ---------- */

  var RIPPLE_SEL = ".btn, .icon-btn, .nav-item, .profile-body, summary, .fab, .chip";
  document.addEventListener("pointerdown", function (event) {
    var host = event.target.closest && event.target.closest(RIPPLE_SEL);
    if (!host) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var rect = host.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height) * 2;
    var dot = document.createElement("span");
    dot.className = "ripple";
    dot.style.width = dot.style.height = size + "px";
    dot.style.left = (event.clientX - rect.left - size / 2) + "px";
    dot.style.top = (event.clientY - rect.top - size / 2) + "px";
    host.appendChild(dot);
    window.setTimeout(function () { if (dot.parentNode) dot.parentNode.removeChild(dot); }, 650);
  });

  /* ---------- orologio del pannello di stato ---------- */

  var clock = document.getElementById("clock");

  function two(n) { return n < 10 ? "0" + n : String(n); }

  function tick() {
    if (!clock) return;
    var now = new Date();
    clock.textContent = two(now.getHours()) + ":" + two(now.getMinutes()) + ":" + two(now.getSeconds());
  }
  tick();
  window.setInterval(tick, 1000);

  /* ---------- profili e prezzi ---------- */

  var euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  var PROFILES = {
    artigiano: {
      title: "L'artigiano",
      text: "Il problema tipico è non farsi trovare online. Serve un sito semplice che mostri i lavori e porti telefonate.",
      items: [
        { name: "Sito vetrina Start, fino a 5 pagine", once: 700 },
        { name: "Manutenzione sito Base", monthly: 39 }
      ]
    },
    studio: {
      title: "Lo studio professionale",
      text: "Ci sono dati sensibili da proteggere e computer che non devono fermarsi. Servono backup e assistenza pronta.",
      items: [
        { name: "Abbonamento Silver, 2 ore incluse", monthly: 99 },
        { name: "Backup cloud automatico", monthly: 25 }
      ]
    },
    negozio: {
      title: "Il negozio",
      text: "Vuole vendere online ma non sa da dove partire. Serve un negozio pronto e qualcuno che lo mantenga.",
      items: [
        { name: "E-commerce Base, fino a 50 prodotti", once: 2800 },
        { name: "Manutenzione sito Plus", monthly: 79 }
      ]
    },
    azienda: {
      title: "La piccola azienda",
      text: "Più postazioni, rete e server da tenere in ordine, e nessun referente informatico. Serve una gestione continua.",
      items: [
        { name: "Server cloud gestito, configurazione", once: 250 },
        { name: "Server cloud gestito, canone", monthly: 59 },
        { name: "Protezione postazioni", perSeat: 8 },
        { name: "Abbonamento Gold, 6 ore incluse", monthly: 249 }
      ]
    }
  };

  var fieldset = document.querySelector(".profiles");
  var rTitle = document.getElementById("r-title");
  var rText = document.getElementById("r-text");
  var rItems = document.getElementById("r-items");
  var rSeats = document.getElementById("r-seats");
  var rOnce = document.getElementById("r-once");
  var rMonth = document.getElementById("r-month");
  var seatsInput = document.getElementById("seats");

  function selectedProfile() {
    var checked = document.querySelector('input[name="profilo"]:checked');
    return checked ? checked.value : "artigiano";
  }

  function seatCount() {
    var n = parseInt(seatsInput.value, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 50) n = 50;
    return n;
  }

  function renderProfile() {
    if (!fieldset || !rItems) return;
    var profile = PROFILES[selectedProfile()];
    var seats = seatCount();
    var once = 0;
    var monthly = 0;
    var usesSeats = false;

    rTitle.textContent = profile.title;
    rText.textContent = profile.text;
    while (rItems.firstChild) rItems.removeChild(rItems.firstChild);

    profile.items.forEach(function (item) {
      var oneOff = item.once || 0;
      var perMonth = item.monthly || 0;
      var label = item.name;

      if (item.perSeat) {
        usesSeats = true;
        perMonth = item.perSeat * seats;
        label = item.name + ", " + seats + (seats === 1 ? " postazione" : " postazioni");
      }

      once += oneOff;
      monthly += perMonth;

      var li = document.createElement("li");
      var name = document.createElement("span");
      var amount = document.createElement("span");
      name.textContent = label;
      amount.className = "amt";
      amount.textContent = oneOff ? euro.format(oneOff) : euro.format(perMonth) + "/mese";
      li.appendChild(name);
      li.appendChild(amount);
      rItems.appendChild(li);
    });

    rSeats.hidden = !usesSeats;
    rOnce.textContent = once ? euro.format(once) : "nessuna";
    rMonth.textContent = monthly ? euro.format(monthly) : "nessuno";
  }

  if (fieldset) {
    fieldset.addEventListener("change", renderProfile);
    seatsInput.addEventListener("input", renderProfile);
    renderProfile();
  }

  /* ---------- modulo di prova ---------- */

  var form = document.getElementById("contact-form");

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      showSnack("Modulo di prova: la richiesta non è stata inviata a nessuno.");
    });
  }
})();
