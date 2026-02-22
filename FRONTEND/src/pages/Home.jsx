import { useState, useEffect } from "react";
import axios from "axios";
import { fetchWeather } from "../services/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const API_BASE = "https://skypulse-g0tf.onrender.com";

const Home = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [compareCity, setCompareCity] = useState("");
  const [compareWeather, setCompareWeather] = useState(null);
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history")) || []
  );

  /* ================= AUTOCOMPLETE ================= */
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (city.length < 2) return setSuggestions([]);

      try {
        const res = await axios.get(
          `${API_BASE}/api/weather/search?query=${city}`
        );
        setSuggestions(res.data);
      } catch {
        setSuggestions([]);
      }
    };

    const delay = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(delay);
  }, [city]);

  /* ================= SEARCH ================= */
  const handleSearch = async (selected) => {
    const finalCity = selected || city;

    try {
      const data = await fetchWeather(finalCity);
      setWeather(data);
      setSuggestions([]);
      setCity(finalCity);

      const updatedHistory = [finalCity, ...history]
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, 5);

      setHistory(updatedHistory);
      localStorage.setItem("history", JSON.stringify(updatedHistory));
    } catch {
      alert("City not found");
    }
  };

  /* ================= LIVE LOCATION ================= */
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const data = await fetchWeather(`${latitude},${longitude}`);
        setWeather(data);
        setCity(data.city);
      },
      () => alert("Location permission denied.")
    );
  };

  const background = weather
    ? getBackground(weather.current.condition)
    : "#0f172a";

  return (
    <div style={{ background, minHeight: "100vh", color: "white" }}>
      <div style={{ maxWidth: "1100px", margin: "auto", padding: "40px" }}>
        <h1>SkyPulse</h1>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: "20px" }}>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city..."
          />
          <button onClick={() => handleSearch()}>Search</button>
          <button onClick={detectLocation}>Use My Location</button>

          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "40px",
                background: "white",
                color: "black",
                width: "250px",
              }}
            >
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() =>
                    handleSearch(`${s.name}, ${s.region}, ${s.country}`)
                  }
                  style={{ padding: "8px", cursor: "pointer" }}
                >
                  {s.name}, {s.region}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HISTORY */}
        <div style={{ marginBottom: "20px" }}>
          {history.map((h) => (
            <button key={h} onClick={() => handleSearch(h)}>
              {h}
            </button>
          ))}
        </div>

        {weather && (
          <>
            {/* CURRENT WEATHER */}
            <div style={{ padding: "20px" }}>
              <h2>
                {weather.city}, {weather.country}
              </h2>
              <h1>{weather.current.temperature}°C</h1>
              <p>
                {weather.current.condition}{" "}
                {getWeatherEmoji(weather.current.condition)}
              </p>
              <p>Feels Like: {weather.current.feels_like}°C</p>

              {/* WIND */}
              <div
                style={{
                  transform: `rotate(${getWindRotation(
                    weather.current.wind_direction
                  )}deg)`,
                  fontSize: "30px",
                }}
              >
                ↑
              </div>
              <p>
                Wind: {weather.current.wind_speed} km/h (
                {weather.current.wind_direction})
              </p>

              {/* AQI */}
              <div
                style={{
                  background: getAQIColor(weather.current.aqi),
                  padding: "6px 12px",
                  borderRadius: "20px",
                  color: "black",
                }}
              >
                AQI: {weather.current.aqi}
              </div>

              {/* POLLUTANTS */}
              {weather.current.air_details && (
                <div>
                  <p>PM2.5: {weather.current.air_details.pm2_5}</p>
                  <p>PM10: {weather.current.air_details.pm10}</p>
                  <p>CO: {weather.current.air_details.co}</p>
                  <p>NO₂: {weather.current.air_details.no2}</p>
                  <p>O₃: {weather.current.air_details.o3}</p>
                </div>
              )}
            </div>

            {/* FORECAST */}
            <h3>14 Day Forecast</h3>
            {weather.forecast.map((day) => (
              <div key={day.date} style={{ marginBottom: "10px" }}>
                {day.date} — {getWeatherEmoji(day.condition)} {day.condition} —
                {day.max_temp}°C / {day.min_temp}°C
                <div>
                  🌅 {day.sunrise} | 🌇 {day.sunset}
                </div>
              </div>
            ))}

            {/* GRAPH */}
            <h3 style={{ marginTop: "40px" }}>
              Temperature Trend (14 Days)
            </h3>
            <Line
              data={{
                labels: weather.forecast.map((d) => d.date),
                datasets: [
                  {
                    label: "Max Temp",
                    data: weather.forecast.map((d) => d.max_temp),
                    borderColor: "orange",
                    tension: 0.3,
                  },
                  {
                    label: "Min Temp",
                    data: weather.forecast.map((d) => d.min_temp),
                    borderColor: "cyan",
                    tension: 0.3,
                  },
                ],
              }}
            />

            <TrendInsight forecast={weather.forecast} />

            {/* COMPARE */}
            <h3>Compare City</h3>
            <input
              value={compareCity}
              onChange={(e) => setCompareCity(e.target.value)}
              placeholder="Enter city"
            />
            <button
              onClick={async () => {
                const data = await fetchWeather(compareCity);
                setCompareWeather(data);
              }}
            >
              Compare
            </button>

            {compareWeather && (
              <p>
                {weather.city}: {weather.current.temperature}°C vs{" "}
                {compareWeather.city}:{" "}
                {compareWeather.current.temperature}°C
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ================= HELPERS ================= */

const getWeatherEmoji = (condition) => {
  const c = condition.toLowerCase();
  if (c.includes("clear") || c.includes("sun")) return "☀️";
  if (c.includes("partly")) return "⛅";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("overcast")) return "🌥️";
  if (c.includes("rain") || c.includes("drizzle")) return "🌧️";
  if (c.includes("storm") || c.includes("thunder")) return "⛈️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze"))
    return "🌫️";
  return "🌤️";
};

const TrendInsight = ({ forecast }) => {
  const diff =
    forecast[forecast.length - 1].max_temp -
    forecast[0].max_temp;

  if (diff > 3) return <p>📈 Warming trend expected</p>;
  if (diff < -3) return <p>📉 Cooling trend expected</p>;
  return <p>🌡 Stable temperatures</p>;
};

const getWindRotation = (dir) => {
  const map = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
  return map[dir] || 0;
};

const getAQIColor = (aqi) => {
  if (aqi === 1) return "#00e400";
  if (aqi === 2) return "#ffff00";
  if (aqi === 3) return "#ff7e00";
  if (aqi === 4) return "#ff0000";
  return "#7e0023";
};

const getBackground = (condition) => {
  const c = condition.toLowerCase();
  if (c.includes("sun"))
    return "linear-gradient(135deg, #f7971e, #ffd200)";
  if (c.includes("rain"))
    return "linear-gradient(135deg, #283c86, #45a247)";
  return "#0f172a";
};

export default Home;