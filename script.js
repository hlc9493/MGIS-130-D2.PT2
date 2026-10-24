// ==========================================
// 1. DATA LAYER
// ==========================================

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// LocalStorage helpers for user profile
const STORAGE_KEYS = {
  NAME: "weather_app_user_name",
  SENSITIVITY: "weather_app_sensitivity"
};

/**
 * Loads user settings from localStorage.
 * @returns {Object}
 */
function loadUserSettings() {
  return {
    name: localStorage.getItem(STORAGE_KEYS.NAME) || "Friend",
    sensitivity: localStorage.getItem(STORAGE_KEYS.SENSITIVITY) || "neutral" // 'cold', 'neutral', 'hot'
  };
}

/**
 * Saves user settings to localStorage.
 * @param {string} name 
 * @param {string} sensitivity 
 */
function saveUserSettings(name, sensitivity) {
  localStorage.setItem(STORAGE_KEYS.NAME, name);
  localStorage.setItem(STORAGE_KEYS.SENSITIVITY, sensitivity);
}

/**
 * Fetches geographic coordinates for a given city name.
 * @param {string} city 
 * @returns {Promise<Object>}
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
 * Fetches current weather using coordinates (asking for wind speed in mph).
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<Object>}
 */
async function fetchWeatherByCoords(lat, lon) {
  const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=mph`;
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
 * Converts Celsius to Fahrenheit.
 * @param {number} celsius 
 * @returns {number}
 */
function convertCelsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

/**
 * Calculates "Feels Like You" temperature based on user profile sensitivity.
 * - Cold: -7°F
 * - Hot: +7°F
 * - Neutral: 0°F
 * @param {number} baseFahrenheit 
 * @param {string} sensitivity 
 * @returns {number}
 */
function calculateFeelsLikeYou(baseFahrenheit, sensitivity) {
  if (sensitivity === "cold") {
    return baseFahrenheit - 7;
  } else if (sensitivity === "hot") {
    return baseFahrenheit + 7;
  }
  return baseFahrenheit;
}

/**
 * Checks if WMO weather code indicates rain or showers.
 * @param {number} code 
 * @returns {boolean}
 */
function isRainyWeather(code) {
  // WMO codes for drizzle, rain, freezing rain, showers, thunderstorms
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95);
}

/**
 * Determines clothing advice based on "Feels Like You" temperature in Fahrenheit.
 * @param {number} feelsLikeTemp 
 * @returns {string}
 */
function getClothingAdvice(feelsLikeTemp) {
  if (feelsLikeTemp >= 80) {
    return "Wear shorts and a light shirt—it's hot!";
  } else if (feelsLikeTemp >= 60) {
    return "A comfortable t-shirt will do.";
  } else if (feelsLikeTemp >= 45) {
    return "Grab a hoodie or light jacket.";
  } else if (feelsLikeTemp >= 30) {
    return "Wear a warm coat to stay cozy.";
  } else {
    return "Bundle up! Big coat, hat, and gloves are a must.";
  }
}

/**
 * Maps WMO weather code to description and standard icon URL.
 * @param {number} code 
 * @returns {Object}
 */
function interpretWmoCode(code) {
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
 * Processes raw API response and user preferences into complete UI data.
 * @param {Object} locationInfo 
 * @param {Object} rawWeather 
 * @param {Object} userSettings 
 * @returns {Object}
 */
function processWeatherData(locationInfo, rawWeather, userSettings) {
  const current = rawWeather.current;
  const tempCelsius = current.temperature_2m;
  const tempFahrenheit = convertCelsiusToFahrenheit(tempCelsius);
  
  const feelsLikeYouF = calculateFeelsLikeYou(tempFahrenheit, userSettings.sensitivity);
  const weatherDetails = interpretWmoCode(current.weather_code);
  const isRaining = isRainyWeather(current.weather_code);
  const isWindy = current.wind_speed_10m > 20;

  // Build Mini Me advice message
  let advice = getClothingAdvice(feelsLikeYouF);
  if (isRaining) {
    advice += " Also, bring an umbrella! ☔";
  }
  if (isWindy) {
    advice += " Heads up, it's pretty windy out there! 💨";
  }

  return {
    cityName: locationInfo.country ? `${locationInfo.name}, ${locationInfo.country}` : locationInfo.name,
    description: weatherDetails.description,
    iconUrl: weatherDetails.iconUrl,
    tempFahrenheit: `${Math.round(tempFahrenheit)}°F`,
    tempCelsius: `${Math.round(tempCelsius)}°C`,
    feelsLikeTag: `Feels like you: ${Math.round(feelsLikeYouF)}°F`,
    humidity: `${current.relative_humidity_2m}%`,
    windSpeed: `${Math.round(current.wind_speed_10m)} mph`,
    miniMeAdvice: advice
  };
}


// ==========================================
// 3. DISPLAY LAYER (UI & DOM INTERACTION)
// ==========================================

// DOM Elements
const userGreetingEl = document.getElementById("user-greeting");
const settingsForm = document.getElementById("settings-form");
const nameInput = document.getElementById("name-input");
const sensitivitySelect = document.getElementById("sensitivity-select");

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const statusMessage = document.getElementById("status-message");
const weatherCard = document.getElementById("weather-card");

const cityNameEl = document.getElementById("city-name");
const weatherDescriptionEl = document.getElementById("weather-description");
const weatherIconEl = document.getElementById("weather-icon");
const tempFahrenheitEl = document.getElementById("temp-fahrenheit");
const tempCelsiusEl = document.getElementById("temp-celsius");
const feelsLikeTagEl = document.getElementById("feels-like-tag");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");
const miniMeAdviceEl = document.getElementById("mini-me-advice");

/**
 * Renders user greeting based on loaded settings.
 */
function updateGreeting() {
  const settings = loadUserSettings();
  userGreetingEl.textContent = `Hi, ${settings.name}! 👋`;
  nameInput.value = settings.name;
  sensitivitySelect.value = settings.sensitivity;
}

/**
 * Renders formatted weather data and Mini Me advice to the DOM.
 * @param {Object} formattedData 
 */
function renderWeather(formattedData) {
  cityNameEl.textContent = formattedData.cityName;
  weatherDescriptionEl.textContent = formattedData.description;
  weatherIconEl.src = formattedData.iconUrl;
  weatherIconEl.alt = formattedData.description;
  tempFahrenheitEl.textContent = formattedData.tempFahrenheit;
  tempCelsiusEl.textContent = formattedData.tempCelsius;
  feelsLikeTagEl.textContent = formattedData.feelsLikeTag;
  humidityEl.textContent = formattedData.humidity;
  windSpeedEl.textContent = formattedData.windSpeed;
  miniMeAdviceEl.textContent = formattedData.miniMeAdvice;

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

// Event Listener: Settings Form Save
settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const sensitivity = sensitivitySelect.value;

  if (!name) return;

  saveUserSettings(name, sensitivity);
  updateGreeting();

  // If a city is already displayed, re-run search to update "Feels Like You" calculations instantly
  if (cityInput.value.trim() && !weatherCard.classList.contains("hidden")) {
    searchForm.dispatchEvent(new Event("submit"));
  }
});

// Event Listener: Search Form Submit
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  const city = cityInput.value.trim();
  if (!city) return;

  showStatus("Searching for location...");

  try {
    const locationInfo = await fetchCoordinates(city);
    showStatus("Fetching weather data...");

    const rawWeather = await fetchWeatherByCoords(locationInfo.lat, locationInfo.lon);
    const userSettings = loadUserSettings();
    
    const formattedData = processWeatherData(locationInfo, rawWeather, userSettings);
    renderWeather(formattedData);
  } catch (error) {
    showStatus(error.message, true);
  }
});

// Initialize app greeting on load
updateGreeting();
