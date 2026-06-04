import React, { useEffect, useRef, useState } from "react";
import { CityData } from "./App";

import frogImg from "./assets/frog.png";
import lotusLeftImg from "./assets/lotus-left.png";

interface Props {
  city: CityData;
  onBack: () => void;
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precip: number;
  condition: string;
  lat: number;
  lon: number;
  location: string;
}

const WMO: Record<number, string> = {
  0: "Clear sky ☀️",
  1: "Mainly clear 🌤️",
  2: "Partly cloudy ⛅",
  3: "Overcast 🌥️",
  45: "Fog 🌫️",
  48: "Rime fog 🌫️",
  51: "Light drizzle 🌦️",
  53: "Drizzle 🌦️",
  55: "Dense drizzle 🌧️",
  61: "Slight rain 🌧️",
  63: "Moderate rain 🌧️",
  65: "Heavy rain 🌧️",
  71: "Slight snow 🌨️",
  73: "Moderate snow 🌨️",
  75: "Heavy snow ❄️",
  80: "Showers 🌦️",
  81: "Moderate showers 🌧️",
  82: "Violent showers ⛈️",
  95: "Thunderstorm ⛈️",
  96: "Thunderstorm w/ hail ⛈️",
};

async function geocode(query: string) {
  const r = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=5&language=en&format=json`
  );
  const d = await r.json();
  return (d.results ?? []) as any[];
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation` +
    `&timezone=auto`;
  const r = await fetch(url);
  const d = await r.json();
  const c = d.current;
  return {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),
    precip: c.precipitation,
    condition: WMO[c.weather_code] ?? `Code ${c.weather_code}`,
    lat,
    lon,
    location: "",
  };
}

export default function CityPage({ city, onBack }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(city.name);
  const [sugg, setSugg] = useState<any[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [cityLabel, setCityLabel] = useState(`${city.name}, ${city.country}`);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Bootstrap Leaflet (CDN, no npm install needed) ────
  useEffect(() => {
    // CSS
    if (!document.getElementById("lf-css")) {
      const link = document.createElement("link");
      link.id = "lf-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const boot = () => {
      const L = (window as any).L;
      leafletRef.current = L;
      initMap(L, city.lat, city.lon);
    };

    if ((window as any).L) {
      boot();
    } else {
      const script = document.createElement("script");
      script.id = "lf-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = boot;
      document.head.appendChild(script);
    }

    return () => {
      mapObjRef.current?.remove();
      mapObjRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initMap(L: any, lat: number, lon: number) {
    if (!mapDivRef.current || mapObjRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [lat, lon],
      zoom: 13,
      zoomControl: true,
    });

    // Voyager tiles — clean, colourful, readable
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { attribution: "© CARTO", subdomains: "abcd", maxZoom: 20 }
    ).addTo(map);

    // Frog pin marker
    const icon = L.divIcon({
      className: "",
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="
            background:linear-gradient(135deg,#ff4444,#cc0000);
            border:3px solid white;
            border-radius:50% 50% 50% 0;
            width:38px;height:38px;
            transform:rotate(-45deg);
            box-shadow:0 4px 18px rgba(255,0,0,0.45);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="transform:rotate(45deg);font-size:20px;line-height:1;">🐸</span>
          </div>
          <div style="
            width:10px;height:10px;
            background:rgba(220,50,50,0.35);
            border-radius:50%;
            margin-top:-3px;
            filter:blur(3px);
          "></div>
        </div>`,
      iconSize: [38, 50],
      iconAnchor: [19, 50],
      popupAnchor: [0, -52],
    });

    const marker = L.marker([lat, lon], { icon }).addTo(map);
    marker
      .bindPopup(
        `<b style="font-family:'Nunito',sans-serif;color:#1a3a5c;">📍 ${city.name}</b>`
      )
      .openPopup();
    markerRef.current = marker;
    mapObjRef.current = map;

    setTimeout(() => map.invalidateSize(), 120);
  }

  function moveMap(lat: number, lon: number, label: string) {
    const map = mapObjRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    map.flyTo([lat, lon], 13, { animate: true, duration: 1.4 });
    marker.setLatLng([lat, lon]);
    marker
      .bindPopup(
        `<b style="font-family:'Nunito',sans-serif;color:#1a3a5c;">📍 ${label}</b>`
      )
      .openPopup();
  }

  // ── Weather fetch ─────────────────────────────────────
  async function loadWeather(lat: number, lon: number, label: string) {
    setLoading(true);
    setError("");
    try {
      const w = await fetchWeather(lat, lon);
      w.location = label;
      setWeather(w);
      moveMap(lat, lon, label);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch weather.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather(city.lat, city.lon, `${city.name}, ${city.country}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Autocomplete ──────────────────────────────────────
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setSugg([]);
      setShowSugg(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const res = await geocode(query);
      setSugg(res);
      setShowSugg(res.length > 0);
    }, 300);
  }, [query]);

  function pickSugg(r: any) {
    setShowSugg(false);
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(", ");
    setQuery(r.name);
    setCityLabel(label);
    loadWeather(r.latitude, r.longitude, label);
  }

  // ── UI ────────────────────────────────────────────────
  return (
    <div style={st.page}>
      {/* LEFT */}
      <div style={st.left}>
        <div style={st.nav}>
          <button style={st.backBtn} onClick={onBack}>
            ←
          </button>
          <img src={frogImg} alt="frog" style={st.navFrog} />
          <span style={st.brand}>WEATHERFROG</span>
        </div>

        <h1 style={st.title}>WLECOME TO WEATHERFROG</h1>

        {/* Search */}
        <div style={st.searchWrap}>
          <span style={st.searchIcon}>🔍</span>
          <input
            style={st.searchInput}
            value={query}
            placeholder="Search city…"
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && sugg.length > 0) pickSugg(sugg[0]);
            }}
          />
          <span style={st.micIcon}>🎤</span>

          {showSugg && (
            <div style={st.suggBox}>
              {sugg.map((r, i) => (
                <div
                  key={i}
                  style={st.suggItem}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#e8f4fd")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "white")
                  }
                  onClick={() => pickSugg(r)}
                >
                  📍 {r.name}
                  <span style={st.suggSub}>
                    {" "}
                    {[r.admin1, r.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* States */}
        {loading && (
          <div style={st.loading}>
            <span style={st.spinner} /> Fetching weather…
          </div>
        )}
        {error && <div style={st.error}>🐸 {error}</div>}

        {/* Data */}
        {weather && !loading && (
          <div style={st.results}>
            <div style={st.cityName}>📍 {cityLabel}</div>
            <div style={st.condBadge}>{weather.condition}</div>

            <InfoRow
              icon="🌡️"
              label="Temperature :"
              value={`${weather.temp}°C`}
              sub={`Feels like ${weather.feelsLike}°C`}
            />
            <InfoRow
              icon="💧"
              label="Humidity :"
              value={`${weather.humidity}%`}
            />
            <InfoRow icon="📍" label="Location :" value={weather.location} />
            <InfoRow
              icon="➕"
              label="Coordinates :"
              value={`${weather.lat.toFixed(4)}°N, ${weather.lon.toFixed(4)}°E`}
            />

            <div style={st.chips}>
              <Chip>💨 Wind: {weather.windSpeed} km/h</Chip>
              <Chip>🌧️ Precip: {weather.precip} mm</Chip>
            </div>
          </div>
        )}

        <img src={lotusLeftImg} alt="" style={st.lotus} />
      </div>

      {/* RIGHT — Map */}
      <div style={st.mapWrap}>
        <div ref={mapDivRef} style={st.map} />
        <div style={st.watermark}>🐸 WeatherFrog</div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 14,
      }}
    >
      <span style={{ fontSize: 19, minWidth: 24, marginTop: 1 }}>{icon}</span>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1a3a5c",
              minWidth: 108,
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: 13, color: "#2c5f8a", fontWeight: 600 }}>
            {value}
          </span>
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "#4a7fa0", marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.28)",
        border: "1px solid rgba(255,255,255,0.45)",
        borderRadius: 20,
        padding: "5px 13px",
        fontSize: 12,
        color: "#1a3a5c",
        fontWeight: 700,
        backdropFilter: "blur(4px)",
      }}
    >
      {children}
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    background:
      "linear-gradient(160deg,#a8d8f0 0%,#5babd6 35%,#2c7fb8 80%,#1a5f8a 100%)",
    fontFamily: "'Nunito',sans-serif",
  },
  left: {
    width: "40%",
    minWidth: 300,
    maxWidth: 440,
    height: "100%",
    padding: "18px 24px 18px 22px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    zIndex: 10,
    overflowY: "auto",
  },
  mapWrap: {
    flex: 1,
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
    borderLeft: "2px solid rgba(255,255,255,0.2)",
  },
  watermark: {
    position: "absolute",
    bottom: 36,
    left: 12,
    zIndex: 1000,
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(6px)",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#1a3a5c",
    fontFamily: "'Fredoka One',cursive",
    pointerEvents: "none",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  nav: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  backBtn: {
    background: "rgba(255,255,255,0.32)",
    border: "none",
    borderRadius: "50%",
    width: 34,
    height: 34,
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navFrog: { width: 32, height: 32, borderRadius: "50%", objectFit: "cover" },
  brand: {
    fontFamily: "'Fredoka One',cursive",
    fontSize: 14,
    color: "#1a3a5c",
    letterSpacing: "1.5px",
  },
  title: {
    fontFamily: "'Fredoka One',cursive",
    fontSize: "clamp(16px,2vw,24px)",
    color: "#1a3a5c",
    margin: "0 0 14px",
  },
  searchWrap: { position: "relative", marginBottom: 18, zIndex: 50 },
  searchInput: {
    width: "100%",
    padding: "11px 44px 11px 36px",
    borderRadius: 50,
    border: "none",
    background: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: "'Nunito',sans-serif",
    outline: "none",
    boxShadow: "0 3px 14px rgba(0,0,0,0.13)",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 15,
    pointerEvents: "none",
  },
  micIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 15,
    cursor: "pointer",
  },
  suggBox: {
    position: "absolute",
    top: "calc(100% + 5px)",
    left: 0,
    right: 0,
    background: "white",
    borderRadius: 12,
    boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
    zIndex: 200,
    overflow: "hidden",
  },
  suggItem: {
    padding: "9px 14px",
    cursor: "pointer",
    fontSize: 13,
    color: "#1a3a5c",
    background: "white",
    transition: "background .15s",
  },
  suggSub: { color: "#999", fontSize: 11 },
  loading: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#2c5f8a",
    marginTop: 8,
  },
  spinner: {
    display: "inline-block",
    width: 16,
    height: 16,
    border: "3px solid rgba(44,95,138,0.25)",
    borderTopColor: "#2c7fb8",
    borderRadius: "50%",
    animation: "spin .7s linear infinite",
    flexShrink: 0,
  },
  error: {
    background: "rgba(255,100,100,0.2)",
    border: "1px solid rgba(255,100,100,0.4)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#8b0000",
    marginTop: 8,
  },
  results: { flex: 1 },
  cityName: {
    fontFamily: "'Fredoka One',cursive",
    fontSize: 19,
    color: "#1a3a5c",
    marginBottom: 6,
    lineHeight: "1.3",
  },
  condBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.3)",
    border: "1px solid rgba(255,255,255,0.45)",
    borderRadius: 20,
    padding: "3px 12px",
    fontSize: 12,
    color: "#1a3a5c",
    fontWeight: 700,
    marginBottom: 16,
  },
  chips: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
  lotus: {
    position: "absolute",
    bottom: -50,
    left: -100,
    width: 300,
    pointerEvents: "none",
    zIndex: 1,
  },
};
