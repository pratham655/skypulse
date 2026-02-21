const weatherService = require("../services/weatherService");
const cache = require("../cache/cache");

// 🔹 Get weather + forecast
exports.getWeather = async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  const cacheKey = city.toLowerCase();

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log("Serving from cache");
    return res.json(cachedData);
  }

  try {
    const data = await weatherService.getForecastByCity(city);

    const response = {
      city: data.location.name,
      country: data.location.country,
      local_time: data.location.localtime,

      current: {
        temperature: data.current.temp_c,
        feels_like: data.current.feelslike_c,
        humidity: data.current.humidity,
        wind_speed: data.current.wind_kph,
        wind_direction: data.current.wind_dir,
        pressure: data.current.pressure_mb,
        condition: data.current.condition.text,
        icon: data.current.condition.icon,
        aqi: data.current.air_quality
          ? data.current.air_quality["us-epa-index"]
          : null,
        air_details: data.current.air_quality || null
      },

      forecast: data.forecast.forecastday.map(day => ({
        date: day.date,
        max_temp: day.day.maxtemp_c,
        min_temp: day.day.mintemp_c,
        avg_temp: day.day.avgtemp_c,
        humidity: day.day.avghumidity,
        condition: day.day.condition.text,
        icon: day.day.condition.icon,
        sunrise: day.astro.sunrise,
        sunset: day.astro.sunset
      }))
    };

    cache.set(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
};

// 🔹 Autocomplete search endpoint
exports.searchCity = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query required" });
  }

  try {
    const results = await weatherService.searchCity(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to search city" });
  }
};