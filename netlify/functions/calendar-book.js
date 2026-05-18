function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function asText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

async function sendResendEmail(args) {
  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: true, reason: "missing RESEND_API_KEY" };

  var resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });

  var text = await resp.text();
  if (!resp.ok) return { ok: false, status: resp.status, body: text };

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch (e) {
    return { ok: true, body: text };
  }
}

async function supabaseRequest(path, options) {
  var url = process.env.SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { skipped: true, reason: "missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" };

  var resp = await fetch(url.replace(/\/$/, "") + path, {
    method: options.method || "GET",
    headers: Object.assign(
      {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
      },
      options.headers || {}
    ),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  var text = await resp.text();
  if (!resp.ok) return { ok: false, status: resp.status, body: text };
  if (!text) return { ok: true, body: null };
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch (e) {
    return { ok: true, body: text };
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "Method not allowed" });

  var payload;
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  // Honeypot
  if (asText(payload.honey || payload.website || payload.company)) return json(200, { ok: true });

  var name = asText(payload.name);
  var email = asText(payload.email);
  var notes = asText(payload.notes);
  var start = asText(payload.start);
  var durationMinutes = Number(payload.durationMinutes || 30);
  var timezoneLabel = asText(payload.timezoneLabel);

  if (!name || !email || !isEmail(email) || !start) {
    return json(400, { ok: false, error: "Missing required fields" });
  }

  var startDate = new Date(start);
  if (String(startDate) === "Invalid Date") return json(400, { ok: false, error: "Invalid time selection" });
  if (!(durationMinutes > 0 && durationMinutes <= 240)) durationMinutes = 30;

  var endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  // Store booking (best effort)
  // Table: public.bookings
  // Columns: id uuid, created_at timestamptz, name text, email text, notes text, start_time timestamptz, end_time timestamptz, timezone_label text
  var insert = await supabaseRequest("/rest/v1/bookings", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: {
      name: name,
      email: email,
      notes: notes,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      timezone_label: timezoneLabel || null,
    },
  });

  if (insert.ok === false) {
    return json(502, { ok: false, error: "Booking storage failed" });
  }

  var toEmail = process.env.BOOKING_TO_EMAIL || process.env.ENQUIRY_TO_EMAIL || "ldwaah@evolution-sportsgroup.com";
  var fromEmail = process.env.FROM_EMAIL || "EvolveOne <no-reply@evolveone.ai>";

  var when = startDate.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short", year: "numeric" });

  // Notify you
  var notify = await sendResendEmail({
    from: fromEmail,
    to: [toEmail],
    subject: "New booking — " + name,
    text:
      "New booking\n\n" +
      "Name: " + name + "\n" +
      "Email: " + email + "\n" +
      "When: " + when + (timezoneLabel ? " (" + timezoneLabel + ")" : "") + "\n" +
      "Duration: " + durationMinutes + " minutes\n" +
      (notes ? ("\nNotes:\n" + notes + "\n") : ""),
    reply_to: email,
  });

  // Confirm user
  await sendResendEmail({
    from: fromEmail,
    to: [email],
    subject: "Booking confirmed — EvolveOne",
    text:
      "Your booking is confirmed.\n\n" +
      "When: " + when + (timezoneLabel ? " (" + timezoneLabel + ")" : "") + "\n" +
      "Duration: " + durationMinutes + " minutes\n\n" +
      "If you need to make changes, reply to this email.\n\n" +
      "EvolveOne\ninfo@evolveone.ai\n",
  });

  if (notify && notify.ok === false) return json(502, { ok: false, error: "Email send failed" });

  return json(200, { ok: true });
};

