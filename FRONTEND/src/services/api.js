import axios from "axios";

const BASE_URL = "https://skypulse-g0tf.onrender.com/api/weather";

export const fetchWeather = async (city) => {
  const response = await axios.get(`${BASE_URL}?city=${city}`);
  return response.data;
};