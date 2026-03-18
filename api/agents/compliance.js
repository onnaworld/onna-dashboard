// Compliance Agent — drafts Risk Assessments + Call Sheets with live weather data
async function geocodeLocation(locationName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName + ", Dubai, UAE")}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": "onna-dashboard/1.0" } });
  const data = await res.json();
  if (data && data[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
  return null;
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max&hourly=temperature_2m,relative_humidity_2m&timezone=Asia%2FDubai&forecast_days=7`;
  const res = await fetch(url);
  return await res.json();
}

function weatherCodeLabel(code) {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Fog";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function formatWeatherSummary(weather) {
  const { daily } = weather;
  if (!daily || !daily.time) return "Weather data unavailable.";
  return daily.time.map((date, i) => (
    `${date}: ${weatherCodeLabel(daily.weather_code[i])}, ${daily.temperature_2m_min[i]}–${daily.temperature_2m_max[i]}°C, ` +
    `Rain: ${daily.precipitation_sum[i]}mm, Wind: ${daily.wind_speed_10m_max[i]} km/h` +
    (daily.uv_index_max ? `, UV: ${daily.uv_index_max[i]}` : "")
  )).join("\n");
}

const SYSTEM = `You are ONNA's Compliance Agent — a serious, methodical safety and legal specialist for film and media productions operating under UAE and international jurisdiction.

Your responsibilities:
1. **Risk Assessment Drafting** — given a project description, generate a structured Risk Assessment using markdown tables covering: Environmental & Terrain Risks, Technical Equipment Risks, Health & Safety, Brand & Privacy, and Emergency Response Plan.
2. **UAE Law Cross-Reference** — cite relevant UAE Federal Laws and Dubai-specific regulations:
   - UAE Federal Law No. 8 of 1980 (Labour Law) — worker safety
   - Dubai Tourism & Commerce Marketing (DTCM) filming permits
   - UAE Media Regulatory Office (NMRP) broadcast standards
   - Dubai Civil Defence fire safety requirements
   - UAE Federal Law No. 11 of 1992 (Civil Procedure) — liability
3. **International Standards** — reference ISO 45001 (Occupational Health & Safety), IOSH guidance, and UK HSE standards where applicable.
4. **Permit Checklist** — flag which permits are required for the shoot type and location.
5. **Call Sheet Support** — when given images (maps, weather screenshots, location photos), extract and summarize the relevant information for inclusion in call sheets. Describe what you see clearly and accurately.
6. **Live Weather** — when live weather data is injected, format it clearly for call sheet use with practical notes for the production crew (sun protection, rain cover, etc.)

Risk Assessment format:
\`\`\`
RISK ASSESSMENT
SHOOT NAME: [name]
SHOOT DATE: [date]
LOCATION: [location]
CREW ON SET: [number]
TIMING: [times]

| Hazard | Risk Level | Who is at Risk | Mitigation Strategy |
|--------|------------|----------------|---------------------|

EMERGENCY RESPONSE PLAN
| Contact | Details |
| Emergency | 999 / 998 / 997 |
| Production Lead (Emily) | +971 585 608 616 |
\`\`\`

You are precise, authoritative, and never casual. Every risk must be mitigated. Every answer references real law. Flag missing information with ⚠️.

@ONNAPRODUCTION | DUBAI & LONDON`;

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://app.onna.digital,https://app.onna.world").split(",");

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.includes(req.headers.origin) ? req.headers.origin : ALLOWED_ORIGINS[0]);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, system: clientSystem } = req.body || {};
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages required" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.includes(req.headers.origin) ? req.headers.origin : ALLOWED_ORIGINS[0]);

  // Extract text from last user message (may be string or multimodal array)
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  let lastUserText = "";
  if (lastUserMsg) {
    if (typeof lastUserMsg.content === "string") {
      lastUserText = lastUserMsg.content;
    } else if (Array.isArray(lastUserMsg.content)) {
      lastUserText = lastUserMsg.content.filter(b => b.type === "text").map(b => b.text).join(" ");
    }
  }

  // Detect weather request and fetch live data
  let dataContext = "";
  try {
    const wantsWeather = /weather|forecast|temperature|rain|wind|climate|sun|humidity|uv/i.test(lastUserText);
    if (wantsWeather) {
      // Try to extract a location from the message
      const locMatch = lastUserText.match(/(?:weather|forecast|temperature|data|info|details)?\s*(?:for|in|at|near|around)\s+([A-Za-z0-9\s,]+?)(?:\s*(?:today|tomorrow|this week|next week|please|thanks|\?|$))/i);
      const location = locMatch ? locMatch[1].trim() : "Dubai";

      const coords = await geocodeLocation(location).catch(() => null);
      if (coords) {
        const weather = await getWeather(coords.lat, coords.lon).catch(() => null);
        if (weather) {
          dataContext = `\n\n[LIVE WEATHER DATA — ${location}]\n${formatWeatherSummary(weather)}\n\nPresent this data clearly formatted for a call sheet. Add practical crew notes (sun protection, hydration, rain cover, etc.)`;
        }
      }
    }
  } catch (_) {
    // data fetch errors are non-fatal
  }

  // Inject data context into the last user message
  const augmentedMessages = dataContext ? messages.map((m, i) => {
    if (i === messages.length - 1 && m.role === "user") {
      if (typeof m.content === "string") {
        return { ...m, content: m.content + dataContext };
      } else if (Array.isArray(m.content)) {
        return { ...m, content: [...m.content, { type: "text", text: dataContext }] };
      }
    }
    return m;
  }) : messages;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        stream: true,
        system: clientSystem || SYSTEM,
        messages: augmentedMessages,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      res.write(`data: ${JSON.stringify({ error: `Anthropic error ${upstream.status}: ${err}` })}\n\n`);
      return res.end();
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
