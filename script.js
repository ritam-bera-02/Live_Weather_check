// ==========================================
// 1. CONFIGURATION & DOM ELEMENTS
// ==========================================
const API_KEY = "f17350e45aba3fb9e23fbf3f26ce5ce3"; // Replace with your environment configuration
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("search-btn");
const message = document.getElementById("message");
const weatherContent = document.getElementById("weather-content");
const emptyState = document.getElementById("empty-state");
//Elements such as the search form, input box, button, and message display area have been selected from the HTML file using ⁠ document.getElementById() ⁠ and stored in variables so that they can be modified later using JavaScript.

// ==========================================
// 2. EVENT LISTENERS
// ==========================================
form.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevents default form page reload
    getWeather();
});

// ==========================================
// 3. MAIN DATA FETCHING LOGIC
// ==========================================
async function getWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        showMessage("Please enter a city name.", true);
        cityInput.focus();
        return;
    }

    setLoading(true);
    showMessage("Fetching live weather...");

    try {
        // Parallel API calls using Promise.all for faster execution
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
            fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
        ]);

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        if (!currentResponse.ok) {
            throw new Error(currentData.message || "City not found.");
        }

        if (!forecastResponse.ok) {
            throw new Error(forecastData.message || "Forecast unavailable.");
        }

        // Update UI components
        displayWeather(currentData); // Display current weather data
        displayHourlyForecast(forecastData.list); // Display hourly forecast data
        updateBackground(currentData.weather[0].main); // Update background based on weather

        showMessage(""); // Clear loading/error messages
    } catch (error) {
        weatherContent.classList.add("hidden"); // Hide weather content
        emptyState.classList.remove("hidden"); // Show empty state if there's an error
        showMessage( // Show error message
            error.message.toLowerCase().includes("not found")
                ? "City not found. Check the spelling and try again."
                : "Unable to load weather right now. Please try again.",
            true
        );
    } finally {
        setLoading(false);
    }
}

// ==========================================
// 4. Weather Icon or UI RENDERING FUNCTIONS
// ==========================================

/**
 * Renders current weather parameters onto the page.
 * @param {Object} data - Current weather JSON response from OpenWeather API
 */
function displayWeather(data) {
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    document.getElementById("city-name").textContent =
        `${data.name}${data.sys?.country ? ", " + data.sys.country : ""}`; // Display city name and country

    document.getElementById("weather-description").textContent = data.weather[0].description; // Display weather description
    document.getElementById("weather-condition").textContent = data.weather[0].description;
    document.getElementById("temperature").textContent = `${Math.round(data.main.temp)}°`; //It uses Math.round() to convert a decimal temperature (e.g., 28.6) into an integer (29°) for display.
    document.getElementById("feels-like").textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
    document.getElementById("humidity").textContent = `${data.main.humidity}%`;
    
    // Convert wind speed from m/s to km/h (m/s * 3.6)
    document.getElementById("wind").textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;
    
    // Convert visibility from meters to kilometers
    document.getElementById("visibility").textContent = `${(data.visibility / 1000).toFixed(1)} km`;

    const weatherIcon = document.getElementById("weather-icon");
    weatherIcon.src = iconUrl;
    weatherIcon.alt = data.weather[0].description;

    document.getElementById("current-time").textContent = formatTime(new Date(data.dt * 1000));

    weatherContent.classList.remove("hidden");
    emptyState.classList.add("hidden");//Once all the data is correctly populated, the empty state is hidden, and the actual weather card content is made visible on the screen.
}

/**
 * Dynamically builds and inserts hourly forecast cards.
 * @param {Array} hourlyData - Array of forecast items from OpenWeather API
 */
function displayHourlyForecast(hourlyData) { //The function of this component is to generate weather cards for the next 24 hours and arrange them on the screen.
    const forecastContainer = document.getElementById("hourly-forecast");
    forecastContainer.innerHTML = ""; // Clear existing elements

    // Process the first 8 slots (24-hour preview in 3-hour increments)
    hourlyData.slice(0, 8).forEach((item) => {
        const date = new Date(item.dt * 1000);
        const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;

        const card = document.createElement("div");
        card.className = "hourly-item";

        // Creating elements explicitly to avoid XSS vulnerabilities
        const timeDiv = document.createElement("div");
        timeDiv.className = "hour-time";
        timeDiv.textContent = formatHour(date);

        const img = document.createElement("img");
        img.src = iconUrl;
        img.alt = item.weather[0].description;

        const tempDiv = document.createElement("div");
        tempDiv.className = "hour-temp";
        tempDiv.textContent = `${Math.round(item.main.temp)}°C`;

        const conditionDiv = document.createElement("div");
        conditionDiv.className = "hour-condition";
        conditionDiv.textContent = item.weather[0].description;

        card.appendChild(timeDiv);
        card.appendChild(img);
        card.appendChild(tempDiv);
        card.appendChild(conditionDiv);

        forecastContainer.appendChild(card);
    });
}

/**
 * Updates CSS background class on body according to primary weather state.
 * @param {string} condition - Main weather category (e.g., 'Clear', 'Clouds', 'Rain')
 */
function updateBackground(condition) { // Update background based on weather condition
    document.body.className = ""; //If there is any pre-existing CSS class on the HTML ⁠ <body> ⁠ tag, it is removed first.
    const type = condition.toLowerCase();

    if (type.includes("clear")) {
        document.body.classList.add("clear");
    } else if (type.includes("cloud")) {
        document.body.classList.add("clouds");
    } else if (type.includes("rain") || type.includes("drizzle")) {
        document.body.classList.add("rain");
    } else if (type.includes("thunder")) {
        document.body.classList.add("storm");
    } else if (type.includes("snow")) {
        document.body.classList.add("snow");
    }
} //if the weather is "Clear", the ⁠ clear ⁠ class will be added to the ⁠ <body> ⁠; if it is "Rain" or "Drizzle", the ⁠ rain ⁠ class will be added.

// ==========================================
// 5. UTILITY & HELPER FUNCTIONS --The purpose of functions is to keep the main code clean and to easily perform small, frequently used tasks.
// ==========================================
function formatHour(date) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
}

function setLoading(isLoading) {
    searchBtn.disabled = isLoading; // Disable search button while loading
    const btnSpan = searchBtn.querySelector("span"); 
    if (btnSpan) {
        btnSpan.textContent = isLoading ? "Loading..." : "Search";
    }
}