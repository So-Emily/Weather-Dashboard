// Function to initialize the page
function initPage() {
    // ALL THE VARIABLES or References to the HTML elements in the DOM
    const cityEl = document.getElementById("enter-city"); // Input field for city name
    const searchEl = document.getElementById("search-button"); // Search button
    const clearEl = document.getElementById("clear-history"); // Clear history button
    const nameEl = document.getElementById("city-name"); // Element to display city name
    const currentPicEl = document.getElementById("current-pic"); // Element to display current weather icon
    const currentTempEl = document.getElementById("temperature"); // Element to display current temperature
    const currentHumidityEl = document.getElementById("humidity"); // Element to display current humidity
    const currentWindEl = document.getElementById("wind-speed"); // Element to display current wind speed
    const currentUVEl = document.getElementById("UV-index"); // Element to display current UV index
    const historyEl = document.getElementById("history"); // Element to display search history
    var fivedayEl = document.getElementById("fiveday-header"); // Element to display 5-day forecast header
    var todayweatherEl = document.getElementById("today-weather"); // Element to display today's weather

    // Retrieve search history from local storage or initialize an empty array
    let searchHistory = JSON.parse(localStorage.getItem("search")) || [];

    // Assigning a unique API key to a variable
    const APIKey = "70f70252362422739d04e47712207f38";

    // Event listener for search form submission - press enter to search
    document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from being submitted normally

    // Trigger the search button click event
    document.getElementById('search-button').click();
    });

    // Function to get weather data for a given city
    function getWeather(cityName) {
        // Construct the URL for the current weather API request
        let queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&appid=" + APIKey;
        axios.get(queryURL)
            .then(function (response) {
                // Display today's weather information
                todayweatherEl.classList.remove("d-none");
                // Get the current date
                const currentDate = new Date(response.data.dt * 1000);
                const day = currentDate.getDate();
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();
                nameEl.innerHTML = response.data.name + " (" + month + "/" + day + "/" + year + ") ";

                // Get the weather icon
                let weatherPic = response.data.weather[0].icon;
                currentPicEl.setAttribute("src", "https://openweathermap.org/img/wn/" + weatherPic + "@2x.png");
                currentPicEl.setAttribute("alt", response.data.weather[0].description);

                // Get the temperature, humidity, and wind speed
                currentTempEl.innerHTML = "Temperature: " + k2f(response.data.main.temp) + " &#176F";
                currentHumidityEl.innerHTML = "Humidity: " + response.data.main.humidity + "%";
                currentWindEl.innerHTML = "Wind Speed: " + response.data.wind.speed + " MPH";

                // Get UV Index
                let lat = response.data.coord.lat;
                let lon = response.data.coord.lon;

                // Construct the URL for the UV Index API request
                let UVQueryURL = "https://api.openweathermap.org/data/2.5/uvi/forecast?lat=" + lat + "&lon=" + lon + "&appid=" + APIKey + "&cnt=1";
                axios.get(UVQueryURL)
                    .then(function (response) {
                        let UVIndex = document.createElement("span");
                        // Set the color of the UV Index based on its value
                        if (response.data[0].value < 4) {
                            UVIndex.setAttribute("class", "badge badge-success");
                        } else if (response.data[0].value < 8) {
                            UVIndex.setAttribute("class", "badge badge-warning");
                        } else {
                            UVIndex.setAttribute("class", "badge badge-danger");
                        }
                        UVIndex.innerHTML = response.data[0].value;
                        currentUVEl.innerHTML = "UV Index: ";
                        currentUVEl.append(UVIndex);
                    });

                // Get 5-day forecast for this city
                let cityID = response.data.id;
                let forecastQueryURL = "https://api.openweathermap.org/data/2.5/forecast?id=" + cityID + "&appid=" + APIKey;
                axios.get(forecastQueryURL)
                    .then(function (response) {
                        fivedayEl.classList.remove("d-none");
                        // Display forecast for the next 5 days
                        const forecastEls = document.querySelectorAll(".forecast");
                        for (i = 0; i < forecastEls.length; i++) {
                            // Clear old forecast data
                            forecastEls[i].innerHTML = "";
                            
                            const forecastIndex = i * 8 + 4;
                            const forecastDate = new Date(response.data.list[forecastIndex].dt * 1000);
                            const forecastDay = forecastDate.getDate();
                            const forecastMonth = forecastDate.getMonth() + 1;
                            const forecastYear = forecastDate.getFullYear();
                            
                            const forecastDateEl = document.createElement("p");
                            forecastDateEl.setAttribute("class", "mt-3 mb-0 forecast-date");
                            forecastDateEl.innerHTML = forecastMonth + "/" + forecastDay + "/" + forecastYear;
                            forecastEls[i].append(forecastDateEl);
                            
                            const forecastWeatherEl = document.createElement("img");
                            forecastWeatherEl.setAttribute("src", "https://openweathermap.org/img/wn/" + response.data.list[forecastIndex].weather[0].icon + "@2x.png");
                            forecastWeatherEl.setAttribute("alt", response.data.list[forecastIndex].weather[0].description);
                            forecastEls[i].append(forecastWeatherEl);

                            const forecastTempEl = document.createElement("p");
                            forecastTempEl.innerHTML = "Temp: " + k2f(response.data.list[forecastIndex].main.temp) + " &#176F";
                            forecastEls[i].append(forecastTempEl);

                            const forecastHumidityEl = document.createElement("p");
                            forecastHumidityEl.innerHTML = "Humidity: " + response.data.list[forecastIndex].main.humidity + "%";
                            forecastEls[i].append(forecastHumidityEl);
                        }
                    })
            });
    }

    // Event listener for search button
    searchEl.addEventListener("click", function () {
        const searchTerm = cityEl.value;
        getWeather(searchTerm);
        searchHistory.push(searchTerm);
        localStorage.setItem("search", JSON.stringify(searchHistory));
        addCityToSearchHistory(searchTerm);
    })

    // Event listener for clear history button
    clearEl.addEventListener("click", function () {
        localStorage.clear();
        searchHistory = [];
        renderSearchHistory();
    })

    // Function to convert temperature from Kelvin to Fahrenheit
    function k2f(K) {
        return Math.floor((K - 273.15) * 1.8 + 32);
    }
    
    // Functions to make the search history never have duplicates
    // Step 1 & 3: Load and Save Search History
    function loadAndDeduplicateSearchHistory() {
        // Load search history from localStorage or initialize as empty array if not present
        searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
        // Deduplicate
        searchHistory = deduplicateArray(searchHistory);
        // Render the deduplicated search history
        renderSearchHistory();
    }

    // Step 2: Deduplicate Function
    function deduplicateArray(array) {
        return [...new Set(array)];
    }

    // Modified addCityToSearchHistory to include localStorage update
    function addCityToSearchHistory(city) {
        if (!searchHistory.includes(city)) {
            searchHistory.push(city);
        } else {
            searchHistory = searchHistory.filter(item => item !== city);
            searchHistory.push(city);
        }
        // Save the updated and deduplicated search history to localStorage
        localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
        renderSearchHistory();
    }

    // Initialization Function
    document.addEventListener("DOMContentLoaded", loadAndDeduplicateSearchHistory);

    // Function to render search history
    function renderSearchHistory() {
        historyEl.innerHTML = "";
        for (let i = 0; i < searchHistory.length; i++) {
            const historyItem = document.createElement("input");
            historyItem.setAttribute("type", "text");
            historyItem.setAttribute("readonly", true);
            historyItem.setAttribute("class", "form-control d-block bg-white");
            historyItem.setAttribute("value", searchHistory[i]);
            historyItem.addEventListener("click", function () {
                getWeather(historyItem.value);
            })
            historyEl.append(historyItem);
        }
    }

    // Render search history on page load
    renderSearchHistory();

    // Get weather for the last searched city, if any
    if (searchHistory.length > 0) {
        getWeather(searchHistory[searchHistory.length - 1]);
    }
}

// Initialize the page
initPage();