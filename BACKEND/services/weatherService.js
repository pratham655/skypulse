const axios = require("axios");
const { BASE_URL, API_KEY } = require("../config/apiConfig");

exports.getForecastByCity = async (city) => {
  const response = await axios.get(
    `${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=14&aqi=yes&alerts=no`
  );
  return response.data;
};

exports.searchCity = async (query) => {
  const response = await axios.get(
    `${BASE_URL}/search.json?key=${API_KEY}&q=${query}`
  );
  return response.data;
};