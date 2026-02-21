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
      if (city.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await axios.get(
          `http://localhost:5000/api/weather/search?query=${city}`
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
    let extractedCity = selected || city;

    try {
      const data = await fetchWeather(extractedCity);
      setWeather(data);
      setSuggestions([]);
      setCity(extractedCity);

      const updatedHistory = [extractedCity, ...history]
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, 5);

      setHistory(updatedHistory);
      localStorage.setItem("history", JSON.stringify(updatedHistory));

    } catch {
      alert("City not found");
    }
  };

  const background = weather
    ? getBackground(weather.current.condition)
    : "#0f172a";

  return (
    <div style={{ background, minHeight: "100vh", color: "white" }}>
      <div style={{ maxWidth: "1100px", margin: "auto", padding: "40px" }}>
        <h1>SkyPulse</h1>
        <p style={{ opacity: 0.7 }}>
          Intelligent Weather & AQI Monitoring Platform
        </p>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ padding: "10px", borderRadius: "20px", border: "none" }}
          />

          <button onClick={() => handleSearch()} style={{ marginLeft: "10px" }}>
            Search
          </button>

          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "45px",
                background: "white",
                color: "black",
                width: "250px",
                borderRadius: "10px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() =>
                    handleSearch(`${s.name}, ${s.region}, ${s.country}`)
                  }
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {s.name}, {s.region}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HISTORY */}
        {history.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <strong>Recent:</strong>
            {history.map((h) => (
              <button
                key={h}
                onClick={() => handleSearch(h)}
                style={{
                  margin: "5px",
                  padding: "5px 10px",
                  borderRadius: "15px",
                  border: "none",
                }}
              >
                {h}
              </button>
            ))}
          </div>
        )}

        {/* WEATHER DISPLAY */}
        {weather && (
          <>
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "20px",
                borderRadius: "15px",
                marginBottom: "30px",
              }}
            >
              <h2>
                {weather.city}, {weather.country}
              </h2>

              <img src={`https:${weather.current.icon}`} alt="icon" />
              <h2>{weather.current.temperature}°C</h2>
              <p>{weather.current.condition}</p>

              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  backgroundColor: getAQIColor(weather.current.aqi),
                  color: "black",
                  display: "inline-block",
                }}
              >
                AQI: {weather.current.aqi}
              </div>

              <p>{getHealthAdvice(weather.current.aqi)}</p>

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
            <h3>14-Day Forecast</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
              {weather.forecast.map((day) => (
                <div
                  key={day.date}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    padding: "15px",
                    borderRadius: "12px",
                    width: "160px",
                    textAlign: "center",
                  }}
                >
                  <p>{day.date}</p>
                  <img src={`https:${day.icon}`} alt="icon" />
                  <p>
                    {day.max_temp}°C / {day.min_temp}°C
                  </p>
                </div>
              ))}
            </div>

            {/* CHART */}
            <h3 style={{ marginTop: "40px" }}>Temperature Trend</h3>
            <Line
              data={{
                labels: weather.forecast.map((d) => d.date),
                datasets: [
                  {
                    label: "Max Temp",
                    data: weather.forecast.map((d) => d.max_temp),
                    borderColor: "orange",
                  },
                  {
                    label: "Min Temp",
                    data: weather.forecast.map((d) => d.min_temp),
                    borderColor: "cyan",
                  },
                ],
              }}
            />

            {/* TREND INSIGHT */}
            <TrendInsight forecast={weather.forecast} />

            {/* COMPARE SECTION */}
            <div style={{ marginTop: "40px" }}>
              <h3>Compare City</h3>
              <input
                value={compareCity}
                onChange={(e) => setCompareCity(e.target.value)}
                placeholder="Enter city"
                style={{ padding: "8px", borderRadius: "20px" }}
              />
              <button
                onClick={async () => {
                  const data = await fetchWeather(compareCity);
                  setCompareWeather(data);
                }}
                style={{ marginLeft: "10px" }}
              >
                Compare
              </button>

              {compareWeather && (
                <div style={{ marginTop: "10px" }}>
                  <p>
                    {weather.city}: {weather.current.temperature}°C
                  </p>
                  <p>
                    {compareWeather.city}:{" "}
                    {compareWeather.current.temperature}°C
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* HELPERS */

const TrendInsight = ({ forecast }) => {
  const diff =
    forecast[forecast.length - 1].max_temp -
    forecast[0].max_temp;

  if (diff > 3) return <p>📈 Warming trend expected.</p>;
  if (diff < -3) return <p>📉 Cooling trend expected.</p>;
  return <p>🌡 Stable temperature trend.</p>;
};

const getAQIColor = (aqi) => {
  if (aqi === 1) return "#00e400";
  if (aqi === 2) return "#ffff00";
  if (aqi === 3) return "#ff7e00";
  if (aqi === 4) return "#ff0000";
  return "#7e0023";
};

const getHealthAdvice = (aqi) => {
  if (aqi === 1) return "Air quality is excellent.";
  if (aqi === 2) return "Air quality is acceptable.";
  if (aqi === 3) return "Sensitive groups should limit exposure.";
  if (aqi === 4) return "Reduce outdoor activities.";
  return "Hazardous air quality.";
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