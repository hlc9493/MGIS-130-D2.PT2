# MGIS-130-D2.PT2
Weather Dashboard

**Live app:** https://hlc9493.github.io/MGIS-130-D2.PT2/

## Data (what goes in)
The city the user types, plus current weather from the free Open-Meteo APIs (no API key needed). The Geocoding API turns the city name into coordinates, and the Forecast API uses them to get the temperature, humidity, wind speed and weather code. The user's name and whether they run cold, neutral or hot are saved in localStorage.

## Processing (what it does)
Converts the temperature from Celsius to Fahrenheit, then makes a "Feels Like You" temperature: 7°F colder if you run cold, 7°F warmer if you run hot. That number picks an outfit (shorts at 80°F and up, t-shirt at 60–79°F, hoodie at 45–59°F, warm coat at 30–44°F, big coat, hat and gloves under 30°F). It also turns the weather code into a description, adds an umbrella reminder when it's raining and a warning when the wind is over 20 mph, and picks the background.

## Presentation (how it looks)
A light blue and white page with squared edges: a settings box, a search bar, a weather card, and a fox mascot called Mini Me who gives outfit advice in a speech bubble. The background changes for clear, cloudy, rainy or snowy weather, and the layout works at phone width.

## Done looks like
1. Typing a city shows its current temperature and weather
2. A misspelled city shows a friendly error, not a blank page
3. Running cold makes the Feels Like You temperature lower and can change the outfit
4. It's readable at phone width
