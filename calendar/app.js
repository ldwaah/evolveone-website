(function () {
  function getConfig() {
    return (window.CALENDAR_CONFIG && typeof window.CALENDAR_CONFIG === "object")
      ? window.CALENDAR_CONFIG
      : {};
  }

  var cfg = getConfig();
  var brandName = cfg.brandName || "Calendar";
  var headline = cfg.headline || "Book a call";
  var subhead = cfg.subhead || "";
  var accent = (cfg.theme && cfg.theme.accent) ? cfg.theme.accent : "#0071e3";

  var booking = (cfg.booking && typeof cfg.booking === "object") ? cfg.booking : {};
  var durationMinutes = Number(booking.durationMinutes || 30);
  var daysAhead = Number(booking.daysAhead || 14);
  var minNoticeHours = Number(booking.minNoticeHours || 0);
  var slotIntervalMinutes = Number(booking.slotIntervalMinutes || durationMinutes);
  var weeklyHours = Array.isArray(booking.weeklyHours) ? booking.weeklyHours : [];
  var timezoneLabel = booking.timezoneLabel || "";

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function parseHHMM(hhmm) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || "").trim());
    if (!m) return null;
    var h = Number(m[1]), mins = Number(m[2]);
    if (!(h >= 0 && h <= 23 && mins >= 0 && mins <= 59)) return null;
    return { h: h, m: mins };
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  function formatDay(d) {
    return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  }

  function formatTime(d) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function getHoursForWeekday(weekday) {
    return weeklyHours.filter(function (w) { return Number(w.weekday) === weekday; });
  }

  function buildSlots() {
    var now = new Date();
    var minTime = addMinutes(now, Math.max(0, minNoticeHours) * 60);
    var out = [];

    for (var i = 0; i < daysAhead; i++) {
      var day = addMinutes(startOfDay(now), i * 24 * 60);
      var weekday = day.getDay(); // 0 Sun .. 6 Sat
      var windows = getHoursForWeekday(weekday);
      if (!windows.length) continue;

      var daySlots = [];
      windows.forEach(function (w) {
        var s = parseHHMM(w.start);
        var e = parseHHMM(w.end);
        if (!s || !e) return;

        var start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), s.h, s.m, 0, 0);
        var end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), e.h, e.m, 0, 0);
        if (end <= start) return;

        for (var t = new Date(start.getTime()); t < end; t = addMinutes(t, slotIntervalMinutes)) {
          var slotEnd = addMinutes(t, durationMinutes);
          if (slotEnd > end) break;
          if (t < minTime) continue;
          daySlots.push(new Date(t.getTime()));
        }
      });

      if (daySlots.length) out.push({ day: day, slots: daySlots });
    }

    return out;
  }

  document.documentElement.style.setProperty("--accent", accent);

  var brandEl = document.getElementById("brandName");
  var hEl = document.getElementById("headline");
  var sEl = document.getElementById("subhead");
  var tzEl = document.getElementById("tzLabel");
  var dateListEl = document.getElementById("dateList");
  var timeListEl = document.getElementById("timeList");
  var selectedDayLabelEl = document.getElementById("selectedDayLabel");
  var form = document.getElementById("bookingForm");
  var selectedStart = document.getElementById("selectedStart");
  var submitBtn = document.getElementById("submitBtn");
  var statusEl = document.getElementById("status");

  if (brandEl) brandEl.textContent = brandName;
  if (hEl) hEl.textContent = headline;
  if (sEl) sEl.textContent = subhead;
  if (tzEl) tzEl.textContent = timezoneLabel || "Your timezone";

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || "";
  }

  function setSelected(startIso) {
    if (selectedStart) selectedStart.value = startIso || "";
    if (submitBtn) submitBtn.disabled = !startIso;
    setStatus(startIso ? ("Selected: " + new Date(startIso).toLocaleString()) : "");
  }

  var groups = buildSlots();
  var selectedDayIndex = 0;

  function dayKey(day) {
    return [day.getFullYear(), pad2(day.getMonth() + 1), pad2(day.getDate())].join("-");
  }

  function renderDates() {
    if (!dateListEl) return;
    dateListEl.innerHTML = "";

    if (!groups.length) {
      dateListEl.innerHTML = '<div class="date-item"><div class="date-title">No availability</div></div>';
      return;
    }

    groups.forEach(function (g, idx) {
      var row = document.createElement("div");
      row.className = "date-item";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "date-btn";
      btn.setAttribute("role", "listitem");
      btn.setAttribute("aria-selected", idx === selectedDayIndex ? "true" : "false");
      btn.dataset.key = dayKey(g.day);

      var t = document.createElement("div");
      t.className = "date-title";
      t.textContent = g.day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

      var s = document.createElement("div");
      s.className = "date-sub";
      s.textContent = g.slots.length + " times";

      btn.appendChild(t);
      btn.appendChild(s);

      btn.addEventListener("click", function () {
        selectedDayIndex = idx;
        setSelected("");
        renderDates();
        renderTimes();
      });

      var pill = document.createElement("div");
      pill.className = "pill";
      pill.textContent = idx === 0 ? "Soonest" : "";

      row.appendChild(btn);
      row.appendChild(pill);
      dateListEl.appendChild(row);
    });
  }

  function renderTimes() {
    if (!timeListEl) return;
    timeListEl.innerHTML = "";

    if (!groups.length) return;
    var g = groups[Math.max(0, Math.min(selectedDayIndex, groups.length - 1))];
    if (selectedDayLabelEl) selectedDayLabelEl.textContent = formatDay(g.day);

    var wrap = document.createElement("div");
    wrap.className = "time-wrap";

    var grid = document.createElement("div");
    grid.className = "time-grid";

    g.slots.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "time-btn";
      b.setAttribute("role", "listitem");
      b.setAttribute("aria-selected", "false");
      b.textContent = formatTime(d);
      b.dataset.iso = d.toISOString();
      b.addEventListener("click", function () {
        var all = timeListEl.querySelectorAll(".time-btn[aria-selected='true']");
        all.forEach(function (el) { el.setAttribute("aria-selected", "false"); });
        b.setAttribute("aria-selected", "true");
        setSelected(b.dataset.iso);
      });
      grid.appendChild(b);
    });

    wrap.appendChild(grid);
    timeListEl.appendChild(wrap);
  }

  renderDates();
  renderTimes();
  setSelected("");

  function isEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(str || "").trim());
  }

  async function postBooking(payload) {
    var resp = await fetch("/.netlify/functions/calendar-book", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    var text = await resp.text();
    var data;
    try { data = JSON.parse(text); } catch (e) { data = { ok: false, raw: text }; }
    if (!resp.ok) throw new Error((data && data.error) ? data.error : "Booking failed");
    return data;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("");

      var fd = new FormData(form);
      var honey = String(fd.get("honey") || "").trim();
      if (honey) return;

      var name = String(fd.get("name") || "").trim();
      var email = String(fd.get("email") || "").trim();
      var notes = String(fd.get("notes") || "").trim();
      var start = String(fd.get("start") || "").trim();

      if (!start) return setStatus("Please select a time.");
      if (!name) return setStatus("Please enter your name.");
      if (!email || !isEmail(email)) return setStatus("Please enter a valid email.");

      if (submitBtn) submitBtn.disabled = true;
      setStatus("Confirming…");

      postBooking({
        name: name,
        email: email,
        notes: notes,
        start: start,
        durationMinutes: durationMinutes,
        timezoneLabel: timezoneLabel,
      })
        .then(function () {
          setStatus("Booked. Check your inbox for confirmation.");
          form.reset();
          var selected = timeListEl ? timeListEl.querySelectorAll(".time-btn[aria-selected='true']") : [];
          selected.forEach(function (el) { el.setAttribute("aria-selected", "false"); });
          setSelected("");
        })
        .catch(function (err) {
          setStatus(err && err.message ? err.message : "Booking failed.");
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();

