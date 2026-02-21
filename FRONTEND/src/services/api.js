import axios from "axios";

const BASE_URL = "http://localhost:5000/api/weather";

export const fetchWeather = async (city) => {
  const response = await axios.get(`${BASE_URL}?city=${city}`);
  return response.data;
};