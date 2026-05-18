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

function pick(obj, keys) {
  var out = {};
  keys.forEach(function (k) {
    if (obj && typeof obj[k] !== "undefined") out[k] = obj[k];
  });
  return out;
}

function asText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function buildPlain(summary) {
  var lines = [];
  Object.keys(summary).forEach(function (k) {
    lines.push(k + ": " + String(summary[k] || ""));
  });
  return lines.join("\n");
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
  if (!resp.ok) {
    return { ok: false, status: resp.status, body: text };
  }

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch (e) {
    return { ok: true, body: text };
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  var payload;
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  // Simple bot/honeypot: if filled, accept but do nothing.
  if (asText(payload.website || payload.company || payload.honey)) {
    return json(200, { ok: true });
  }

  var data = pick(payload, [
    "name",
    "email",
    "business",
    "hasWebsite",
    "challenge",
    "bookingMethod",
    "timing",
    "other",
  ]);

  data.name = asText(data.name);
  data.email = asText(data.email);
  data.business = asText(data.business);
  data.hasWebsite = asText(data.hasWebsite);
  data.challenge = asText(data.challenge);
  data.bookingMethod = asText(data.bookingMethod);
  data.timing = asText(data.timing);
  data.other = asText(data.other);

  if (!data.name || !data.business || !data.email || !isEmail(data.email)) {
    return json(400, { ok: false, error: "Missing required fields" });
  }

  var toEmail = process.env.ENQUIRY_TO_EMAIL || "ldwaah@evolution-sportsgroup.com";
  var fromEmail = process.env.FROM_EMAIL || "EvolveOne <no-reply@evolveone.ai>";

  var subject = "New eligibility enquiry — " + data.name;
  var plain = buildPlain({
    Name: data.name,
    Email: data.email,
    "What do you do?": data.business,
    "Have a website?": data.hasWebsite,
    "Biggest challenge": data.challenge,
    "Enquiries / bookings": data.bookingMethod,
    Timing: data.timing,
    "Anything else": data.other,
    "Submitted at": new Date().toISOString(),
  });

  // 1) Notify you
  var notifyResult = await sendResendEmail({
    from: fromEmail,
    to: [toEmail],
    subject: subject,
    text: plain,
    reply_to: data.email,
  });

  // 2) Auto-reply to user (best-effort)
  var ackSubject = "We’ve received your enquiry — EvolveOne";
  var ackText =
    "Thanks for reaching out.\n\n" +
    "We’ve received your eligibility form and we’ll review it shortly.\n\n" +
    "If you need to add anything, reply to this email.\n\n" +
    "EvolveOne\n" +
    "info@evolveone.ai\n";

  var ackResult = await sendResendEmail({
    from: fromEmail,
    to: [data.email],
    subject: ackSubject,
    text: ackText,
  });

  // Even if email provider isn't configured yet, keep the form UX smooth.
  if (notifyResult && notifyResult.ok === false) {
    return json(502, { ok: false, error: "Email send failed" });
  }

  return json(200, { ok: true, emailed: Boolean(notifyResult && notifyResult.ok), autoReply: Boolean(ackResult && ackResult.ok) });
};

