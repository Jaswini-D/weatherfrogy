import React, { useEffect, useState, useRef } from "react";
import { CityData } from "./App";

// ── Asset imports (place these files in src/assets/)
import frogImg from "./assets/frog.png";
import sunImg from "./assets/Sun.png";
import cloudsBgImg from "./assets/Cloudsbg.png";
import lotusLeftImg from "./assets/leaf-left.png";
import leafRightImg from "./assets/lotus-left.png";
import leafletImg from "./assets/leaflet.png";

interface Props {
  onCitySelect: (city: CityData) => void;
}

interface GeoResult {
  name: string;
  country: string;
  country_code: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

const PRESET_CITIES = [
  {
    name: "London",
    country: "UK",
    countryCode: "GB",
    lat: 51.5074,
    lon: -0.1278,
    icon: "🌥️",
  },
  {
    name: "Dubai",
    country: "UAE",
    countryCode: "AE",
    lat: 25.2048,
    lon: 55.2708,
    icon: "⛅",
  },
  {
    name: "Chicago",
    country: "USA",
    countryCode: "US",
    lat: 41.8781,
    lon: -87.6298,
    icon: "🌬️",
  },
  {
    name: "Singapore",
    country: "SG",
    countryCode: "SG",
    lat: 1.3521,
    lon: 103.8198,
    icon: "🌧️",
  },
];

async function geocode(query: string): Promise<GeoResult[]> {
  const r = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=5&language=en&format=json`
  );
  const d = await r.json();
  return d.results ?? [];
}

async function getTemp(lat: number, lon: number): Promise<number> {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`
  );
  const d = await r.json();
  return Math.round(d.current.temperature_2m);
}

export default function Home({ onCitySelect }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSugg] = useState<GeoResult[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [presetTemps, setTemps] = useState<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load preset temps on mount
  useEffect(() => {
    PRESET_CITIES.forEach(async (c) => {
      try {
        const t = await getTemp(c.lat, c.lon);
        setTemps((prev) => ({ ...prev, [c.name]: `${t}°C` }));
      } catch {}
    });
  }, []);

  // Autocomplete
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

  function pickSuggestion(r: GeoResult) {
    setShowSugg(false);
    setQuery(r.name);
    onCitySelect({
      name: r.name,
      country: r.country,
      lat: r.latitude,
      lon: r.longitude,
    });
  }

  function handleSearch(e: React.KeyboardEvent) {
    if (e.key === "Enter" && suggestions.length > 0)
      pickSuggestion(suggestions[0]);
  }

  return (
    <div style={styles.page}>
      {/* Sky background */}
      <img src={cloudsBgImg} alt="" style={styles.cloudsBg} />

      {/* Sun */}
      <img src={sunImg} alt="" style={styles.sun} />

      {/* Navbar */}
      <div style={styles.navbar}>
        <img src={frogImg} alt="frog" style={styles.navFrog} />
        <span style={styles.brand}>WEATHERFROG</span>
      </div>

      {/* Title */}
      <h1 style={styles.title}>WLECOME TO WEATHERFROG</h1>

      {/* Search */}
      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search for a city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          onFocus={() => suggestions.length > 0 && setShowSugg(true)}
          autoComplete="off"
        />
        <span style={styles.micIcon}></span>

        {showSugg && (
          <div style={styles.suggBox}>
            {suggestions.map((r, i) => (
              <div
                key={i}
                style={styles.suggItem}
                onClick={() => pickSuggestion(r)}
              >
                📍 {r.name}
                <span style={styles.suggSub}>
                  {" "}
                  {[r.admin1, r.country].filter(Boolean).join(", ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Forecast section */}
      <p style={styles.forecastTitle}>Frog Forecast Cities</p>
      <p style={styles.forecastSub}>
        Explore the mood of cities across the globe
      </p>

      <div style={styles.cardsRow}>
        {PRESET_CITIES.map((c) => (
          <div
            key={c.name}
            style={styles.card}
            onClick={() =>
              onCitySelect({
                name: c.name,
                country: c.country,
                lat: c.lat,
                lon: c.lon,
              })
            }
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(-6px) scale(1.05)";
              (e.currentTarget as HTMLDivElement).style.background =
                "rgba(255,255,255,0.32)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(0) scale(1)";
              (e.currentTarget as HTMLDivElement).style.background =
                "rgba(255,255,255,0.18)";
            }}
          >
            <div style={styles.cardIcon}>{c.icon}</div>
            <div style={styles.cardCity}>
              {c.name}, {c.country}
            </div>
            <div style={styles.cardTemp}>{presetTemps[c.name] ?? "…"}</div>
          </div>
        ))}
      </div>

      {/* Bottom decorations */}
      <img src={frogImg} alt="frog" style={styles.frogChar} />
      <img src={leafletImg} alt="leaflet" style={styles.leaflet} />
      <img src={lotusLeftImg} alt="lotus" style={styles.lotusLeft} />
      <img src={leafRightImg} alt="leaf" style={styles.leafRight} />
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    background:
      "linear-gradient(175deg,#a8d8f0 0%,#5babd6 30%,#2c7fb8 68%,#1a5f8a 100%)",
    fontFamily: "'Nunito', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  cloudsBg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "50%",
    objectFit: "cover",
    objectPosition: "top",
    opacity: 1.55,
    pointerEvents: "none",
  },
  sun: {
    position: "absolute",
    top: -180,
    right: -350,
    width: 900,
    filter: "drop-shadow(0 0 18px rgba(255,240,80,0.7))",
    animation: "sunPulse 4s ease-in-out infinite",
    pointerEvents: "none",
  },
  navbar: {
    position: "relative",
    zIndex: 10,
    width: "100%",
    padding: "14px 22px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  navFrog: { width: 24, height: 24, borderRadius: "50%", objectFit: "cover" },
  brand: {
    fontFamily: "Dynapuff",
    fontSize: 10,
    color: "#55260b",
    letterSpacing: "1px",
  },
  title: {
    position: "relative",
    zIndex: 5,
    fontFamily: "'Dynapuff', cursive",
    fontSize: "clamp(22px,3vw,36px)",
    color: "#55260b",
    letterSpacing: 1,
    margin: "6px 0 0",
    textShadow: "0 2px 6px rgba(255,255,255,0.3)",
  },
  searchWrap: {
    position: "relative",
    zIndex: 20,
    marginTop: 20,
    width: "min(420px, 88vw)",
  },
  searchInput: {
    width: "100%",
    padding: "13px 48px 13px 42px",
    borderRadius: 50,
    border: "none",
    background: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontFamily: "'Nunito', sans-serif",
    outline: "none",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 16,
  },
  micIcon: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 16,
    cursor: "pointer",
  },
  suggBox: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "white",
    borderRadius: 14,
    boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
    zIndex: 100,
    overflow: "hidden",
  },
  suggItem: {
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: 14,
    color: "#1a3a5c",
    transition: "background .15s",
  },
  suggSub: { color: "#888", fontSize: 12 },

  forecastTitle: {
    fontFamily: "'Timesnewroman', cursive",
    fontSize: 25,
    color: "#1a3a5c",
    marginTop: 30,
    zIndex: 5,
    position: "relative",
  },
  forecastSub: {
    fontSize: 13,
    color: "#2c5f8a",
    marginTop: 2,
    zIndex: 5,
    position: "relative",
  },

  cardsRow: {
    display: "flex",
    gap: 16,
    marginTop: 46,
    flexWrap: "wrap",
    justifyContent: "center",
    zIndex: 5,
    position: "relative",
  },
  card: {
    background: "rgba(255,255,255,0.18)",
    border: "1.5px solid rgba(255,255,255,0.45)",
    borderRadius: 16,
    width: 112,
    padding: "14px 10px",
    textAlign: "center",
    cursor: "pointer",
    backdropFilter: "blur(6px)",
    transition: "transform .2s, background .2s, box-shadow .2s",
    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
  },
  cardIcon: { fontSize: 32, marginBottom: 6 },
  cardCity: { fontSize: 11, fontWeight: 700, color: "#1a3a5c" },
  cardTemp: { fontSize: 12, color: "#2c5f8a", marginTop: 3 },

  // Bottom assets
  frogChar: {
    position: "absolute",
    bottom: -90,
    left: -220,
    width: 630,
    animation: "frogBob 3s ease-in-out infinite",
    pointerEvents: "none",
    zIndex: 3,
  },
  leaflet: {
    position: "absolute",
    bottom: -120,
    left: 100,
    width: 900,
    pointerEvents: "none",
    zIndex: 2,
  },
  lotusLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 200,
    pointerEvents: "none",
    zIndex: 1,
    opacity: 0, // hidden behind frog; set to 1 if you want it visible
  },
  leafRight: {
    position: "absolute",
    bottom: -115,
    right: -225,
    width: 660,
    pointerEvents: "none",
    zIndex: 2,
  },
};
