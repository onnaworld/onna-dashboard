// Researcher Agent — looks up nearest hospital (Overpass API) + 7-day weather (Open-Meteo)
// Real data is fetched server-side and injected into the Anthropic prompt

async function geocodeLocation(locationName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName + ", Dubai, UAE")}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": "onna-dashboard/1.0" } });
  const data = await res.json();
  if (data && data[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
  return null;
}

async function findNearestHospital(lat, lon) {
  const query = `[out:json][timeout:10];(node["amenity"="hospital"](around:10000,${lat},${lon});way["amenity"="hospital"](around:10000,${lat},${lon}););out center 5;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain" },
  });
  const data = await res.json();
  const elements = data.elements || [];
  if (!elements.length) return null;

  // Find nearest by Haversine distance
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dist = (lat2, lon2) => {
    const dLat = toRad(lat2 - lat);
    const dLon = toRad(lon2 - lon);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const nearest = elements
    .map(e => ({ ...e, _lat: e.lat || e.center?.lat, _lon: e.lon || e.center?.lon }))
    .filter(e => e._lat && e._lon)
    .sort((a, b) => dist(a._lat, a._lon) - dist(b._lat, b._lon))[0];

  if (!nearest) return null;
  return {
    name: nearest.tags?.name || "Unnamed Hospital",
    phone: nearest.tags?.phone || nearest.tags?.["contact:phone"] || "N/A",
    distanceKm: dist(nearest._lat, nearest._lon).toFixed(1),
    lat: nearest._lat,
    lon: nearest._lon,
  };
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Asia%2FDubai&forecast_days=7`;
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
    `Rain: ${daily.precipitation_sum[i]}mm, Wind: ${daily.wind_speed_10m_max[i]} km/h`
  )).join("\n");
}

const SYSTEM = `You are ONNA's Researcher Agent ✍️ — a resourceful production researcher with access to real-world data tools.

You help production teams prepare for shoots by:
1. **Finding the nearest hospital** to any Dubai/UAE location (you have live data when relevant)
2. **Checking the 7-day weather forecast** for shoot locations (you have live data when relevant)
3. **Research** — location scouting notes, permit info, logistics tips for Dubai shoots
4. **Practical advice** — what to bring, what to prepare, emergency contacts

When real data has been fetched and included in the conversation, present it clearly and add your expert commentary.

Format responses with clear headers and practical bullet points. Be concise but thorough.`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
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
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Detect location in latest user message to prefetch real data
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
  let dataContext = "";

  try {
    // Look for hospital or weather request
    const wantsHospital = /hospital|emergency|medical|clinic/i.test(lastUserMsg);
    const wantsWeather = /weather|forecast|temperature|rain|wind|climate/i.test(lastUserMsg);

    // Extract a Dubai location if mentioned
    const locMatch = lastUserMsg.match(/(?:near|at|in|around|for)\s+([A-Za-z0-9\s,]+(?:Dubai|Jumeirah|Marina|Deira|Bur Dubai|Downtown|DIFC|JLT|JBR|Palm|Karama|Satwa|Mirdif|Creek|Hills|Springs|Meadows|Lakes|Barsha|Tecom|Rashidiya|Jebel Ali|Silicon Oasis|Academic City)[A-Za-z0-9\s,]*)/i);
    const location = locMatch ? locMatch[1].trim() : wantsHospital || wantsWeather ? "Dubai Marina, Dubai" : null;

    if (location && (wantsHospital || wantsWeather)) {
      const coords = await geocodeLocation(location).catch(() => null);
      if (coords) {
        dataContext += `\n\n[LIVE DATA — ${location}]`;
        if (wantsHospital) {
          const hospital = await findNearestHospital(coords.lat, coords.lon).catch(() => null);
          if (hospital) {
            dataContext += `\nNearest Hospital: ${hospital.name} | Distance: ${hospital.distanceKm} km | Phone: ${hospital.phone} | Coordinates: ${hospital.lat}, ${hospital.lon}`;
          }
        }
        if (wantsWeather) {
          const weather = await getWeather(coords.lat, coords.lon).catch(() => null);
          if (weather) {
            dataContext += `\n7-Day Weather Forecast:\n${formatWeatherSummary(weather)}`;
          }
        }
      }
    }
  } catch (_) {
    // data fetch errors are non-fatal
  }

  // Inject data context into the last user message
  const augmentedMessages = messages.map((m, i) =>
    i === messages.length - 1 && m.role === "user" && dataContext
      ? { ...m, content: m.content + dataContext }
      : m
  );

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
