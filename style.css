// ==========================================
// 1. DATA LAYER
// ==========================================

// Replace with your OpenWeather API key
const API_KEY = "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

/**
 * Fetches current weather data for a given city from OpenWeather API.
 * @param {string} city 
 * @returns {Promise<Object>}
 */
async function fetchWeatherData(city) {
  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("City not found. Please check the spelling.");
    }
    throw new Error("Failed to fetch weather data. Please try again later.");
  }

  return await response.json();
}


// ==========================================
// 2. PROCESSING LAYER (RULES & CONVERSIONS)
// ==========================================

/**
 * Converts Celsius temperature to Fahrenheit.
 * @param {number} celsius 
 * @returns {number}
 */
function convertCelsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

/**
 * Constructs the OpenWeather icon URL from an icon code.
 * @param {string} iconCode 
 * @returns {string}
 */
function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/**
 * Processes raw API response into formatted data ready for the UI.
 * @param {Object} rawData 
 * @returns {Object}
 */
function processWeatherData(rawData) {
  const tempCelsius = rawData.main.temp;
  const tempFahrenheit = convertCelsiusToFahrenheit(tempCelsius);

  return {
    cityName: `${rawData.name}, ${rawData.sys.country}`,
    description: rawData.weather[0].description,
    iconUrl: getWeatherIconUrl(rawData.weather[0].icon),
    tempCelsius: `${Math.round(tempCelsius)}°C`,
    tempFahrenheit: `${Math.round(tempFahrenheit)}°F`,
    humidity: `${rawData.main.humidity}%`,
    windSpeed: `${rawData.wind.speed} m/s`,
  };
}


// ==========================================
// 3. DISPLAY LAYER (UI & DOM INTERACTION)
// ==========================================

// DOM Elements
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const statusMessage = document.getElementById("status-message");
const weatherCard = document.getElementById("weather-card");

const cityNameEl = document.getElementById("city-name");
const weatherDescriptionEl = document.getElementById("weather-description");
const weatherIconEl = document.getElementById("weather-icon");
const tempCelsiusEl = document.getElementById("temp-celsius");
const tempFahrenheitEl = document.getElementById("temp-fahrenheit");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");

/**
 * Renders formatted weather data to the DOM.
 * @param {Object} formattedData 
 */
function renderWeather(formattedData) {
  cityNameEl.textContent = formattedData.cityName;
  weatherDescriptionEl.textContent = formattedData.description;
  weatherIconEl.src = formattedData.iconUrl;
  weatherIconEl.alt = formattedData.description;
  tempCelsiusEl.textContent = formattedData.tempCelsius;
  tempFahrenheitEl.textContent = formattedData.tempFahrenheit;
  humidityEl.textContent = formattedData.humidity;
  windSpeedEl.textContent = formattedData.windSpeed;

  hideStatus();
  weatherCard.classList.remove("hidden");
}

/**
 * Shows status or error message.
 * @param {string} message 
 * @param {boolean} isError 
 */
function showStatus(message, isError = false) {
  weatherCard.classList.add("hidden");
  statusMessage.textContent = message;
  statusMessage.classList.remove("hidden");
  
  if (isError) {
    statusMessage.classList.add("error");
  } else {
    statusMessage.classList.remove("error");
  }
}

/**
 * Hides status messages.
 */
function hideStatus() {
  statusMessage.classList.add("hidden");
}

// Event Listeners
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  const city = cityInput.value.trim();
  if (!city) return;

  if (API_KEY === "YOUR_API_KEY_HERE" || !API_KEY) {
    showStatus("Please set your OpenWeather API key in script.js", true);
    return;
  }

  showStatus("Fetching weather data...");

  try {
    const rawData = await fetchWeatherData(city);
    const formattedData = processWeatherData(rawData);
    renderWeather(formattedData);
  } catch (error) {
    showStatus(error.message, true);
  }
});
