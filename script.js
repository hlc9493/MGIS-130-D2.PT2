// ==========================================
// 1. DATA LAYER
// ==========================================

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

/**
 * Step 1: Fetches coordinates for a given city name.
 * @param {string} city 
 * @returns {Promise<Object>} Latitude, longitude, name, and country
 */
async function fetchCoordinates(city) {
  const response = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1`);
  
  if (!response.ok) {
    throw new Error("Failed to connect to location service.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Please check the spelling.");
  }

  const location = data.results[0];
  return {
    lat: location.latitude,
    lon: location.longitude,
    name: location.name,
    country: location.country || ""
  };
}

/**
 * Step 2: Fetches current weather using coordinates.
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<Object>}
 */
async function fetchWeatherByCoords(lat, lon) {
  const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=ms`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch weather data.");
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
 * Maps OpenWeather-style weather codes (WMO Weather interpretation) to descriptions and icons.
 * Open-Meteo uses WMO codes. Here is a simplified lookup mapper.
 * @param {number} code 
 * @returns {Object} description and icon URL
 */
function interpretWmoCode(code) {
  // Simple mapping for demonstration (using standard OpenWeather icon codes as stand-ins)
  let description = "Clear sky";
  let iconCode = "01d";

  if (code >= 1 && code <= 3) {
    description = "Partly cloudy";
    iconCode = "02d";
  } else if (code >= 45 && code <= 48) {
    description = "Foggy";
    iconCode = "50d";
  } else if (code >= 51 && code <= 67) {
    description = "Rain showers";
    iconCode = "09d";
  } else if (code >= 71 && code <= 77) {
    description = "Snow";
    iconCode = "13d";
  } else if (code >= 95) {
    description = "Thunderstorm";
    iconCode = "11d";
  }

  return {
    description,
    iconUrl: `https://openweathermap.org/img/wn/${iconCode}@2x.png`
  };
}

/**
 * Processes raw API response into formatted data ready for the UI.
 * @param {Object} locationInfo 
 * @param {Object} rawWeather 
 * @returns {Object}
 */
function processWeatherData(locationInfo, rawWeather) {
  const current = rawWeather.current;
  const tempCelsius = current.temperature_2m;
  const tempFahrenheit = convertCelsiusToFahrenheit(tempCelsius);
  const weatherDetails = interpretWmoCode(current.weather_code);

  return {
    cityName: locationInfo.country ? `${locationInfo.name}, ${locationInfo.country}` : locationInfo.name,
    description: weatherDetails.description,
    iconUrl: weatherDetails.iconUrl,
    tempCelsius: `${Math.round(tempCelsius)}°C`,
    tempFahrenheit: `${Math.round(tempFahrenheit)}°F`,
    humidity: `${current.relative_humidity_2m}%`,
    windSpeed: `${current.wind_speed_10m} m/s`,
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

  showStatus("Searching for location...");

  try {
    // Step 1: Get latitude and longitude from city name
    const locationInfo = await fetchCoordinates(city);

    showStatus("Fetching weather data...");

    // Step 2: Get weather data using those coordinates
    const rawWeather = await fetchWeatherByCoords(locationInfo.lat, locationInfo.lon);

    // Step 3: Process and render
    const formattedData = processWeatherData(locationInfo, rawWeather);
    renderWeather(formattedData);
  } catch (error) {
    showStatus(error.message, true);
  }
});
