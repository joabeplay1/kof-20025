// ATENÇÃO: Substitua 'YOUR_OPENWEATHERMAP_API_KEY' pela sua chave de API real para o código buscar os dados.
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

const elements = {
    currentCity: document.getElementById('current-city'),
    currentDate: document.getElementById('current-date'),
    currentTemp: document.getElementById('current-temp'),
    currentWeatherIcon: document.getElementById('current-weather-icon'),
    currentCondition: document.getElementById('current-condition'),
    feelsLike: document.getElementById('feels-like'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    uvIndex: document.getElementById('uv-index'),
    rainChance: document.getElementById('rain-chance'),
    sunriseTime: document.getElementById('sunrise-time'),
    sunsetTime: document.getElementById('sunset-time'),
    airQuality: document.getElementById('air-quality'),
    dailyForecastList: document.getElementById('daily-forecast-list'),
    hourlyForecastList: document.getElementById('hourly-forecast-list'),
    temperatureGraph: document.getElementById('temperature-graph'),
    intelligentMessages: document.getElementById('intelligent-messages'),
    weatherAlerts: document.getElementById('weather-alerts'),
    citySearchInput: document.getElementById('city-search-input'),
    searchButton: document.getElementById('search-button'),
    gpsButton: document.getElementById('gps-button'),
    openSettingsButton: document.getElementById('open-settings-button'),
    settingsModalOverlay: document.getElementById('settings-modal-overlay'),
    closeSettingsButton: document.getElementById('close-settings-button'),
    themeSelector: document.getElementById('theme-selector'),
    unitSelector: document.getElementById('unit-selector'),
    languageSelector: document.getElementById('language-selector'),
    toggleSounds: document.getElementById('toggle-sounds'),
    toggleAnimations: document.getElementById('toggle-animations'),
    requestLocationPermission: document.getElementById('request-location-permission'),
    toggleAutoUpdate: document.getElementById('toggle-auto-update'),
    manageFavorites: document.getElementById('manage-favorites'),
    clearRecentCities: document.getElementById('clear-recent-cities'),
    navBar: document.querySelector('.nav-bar'),
    screens: document.querySelectorAll('.screen')
};

let currentCoords = { lat: null, lon: null };
let currentUnit = localStorage.getItem('weatherUnit') || 'metric';
let currentLang = localStorage.getItem('weatherLang') || 'pt';
let currentTheme = localStorage.getItem('weatherTheme') || 'ocean-blue';
let autoUpdateEnabled = localStorage.getItem('autoUpdate') === 'true';
let animationsEnabled = localStorage.getItem('animationsEnabled') !== 'false';

const weatherIcons = {
    '01d': 'fas fa-sun', '01n': 'fas fa-moon',
    '02d': 'fas fa-cloud-sun', '02n': 'fas fa-cloud-moon',
    '03d': 'fas fa-cloud', '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud-meatball', '04n': 'fas fa-cloud-meatball',
    '09d': 'fas fa-cloud-showers-heavy', '09n': 'fas fa-cloud-showers-heavy',
    '10d': 'fas fa-cloud-sun-rain', '10n': 'fas fa-cloud-moon-rain',
    '11d': 'fas fa-bolt', '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake', '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog', '50n': 'fas fa-smog'
};

const weatherConditionsMap = {
    'Clear': 'Ensolarado', 'Clouds': 'Nublado', 'Rain': 'Chuvoso', 'Drizzle': 'Chuvisco',
    'Thunderstorm': 'Tempestade', 'Snow': 'Nevando', 'Mist': 'Névoa', 'Fog': 'Névoa',
    'Smoke': 'Fumaça', 'Haze': 'Neblina', 'Dust': 'Poeira', 'Sand': 'Areia',
    'Ash': 'Cinzas', 'Squall': 'Vendaval', 'Tornado': 'Tornado'
};

const airQualityMap = {
    1: 'Boa', 2: 'Razoável', 3: 'Moderada', 4: 'Ruim', 5: 'Muito Ruim'
};

function formatTime(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    return date.toISOString().substr(11, 5); 
}

function formatDate(timestamp, timezoneOffset, includeDayOfWeek = true) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    const options = { month: 'short', day: 'numeric' };
    if (includeDayOfWeek) {
        options.weekday = 'short';
    }
    return date.toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : 'en-US', options);
}

function getDayOfWeek(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    return date.toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'long' });
}

function getWeatherIconClass(iconCode) {
    return weatherIcons[iconCode] || 'fas fa-question-circle';
}

function translateCondition(condition) {
    return weatherConditionsMap[condition] || condition;
}

function getTemperatureString(temp) {
    return `${Math.round(temp)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
}

function getWindSpeedString(speed) {
    return `${Math.round(speed * (currentUnit === 'metric' ? 3.6 : 1))} ${currentUnit === 'metric' ? 'km/h' : 'mph'}`;
}

function setDynamicBackground(weatherCondition, isDay) {
    document.body.className = document.body.className.split(' ').filter(c => !c.startsWith('weather-')).join(' '); 
    const currentThemeClass = `theme-${currentTheme}`;
    if (!document.body.classList.contains(currentThemeClass)) {
        document.body.classList.add(currentThemeClass);
    }

    let weatherClass = '';
    if (!isDay) {
        weatherClass = 'weather-night';
    } else if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
        weatherClass = 'weather-rainy';
    } else if (weatherCondition.includes('thunderstorm')) {
        weatherClass = 'weather-storm';
    } else if (weatherCondition.includes('snow')) {
        weatherClass = 'weather-cold';
    } else if (weatherCondition.includes('clear')) {
        weatherClass = 'weather-sunny';
    } else if (weatherCondition.includes('clouds')) {
        weatherClass = 'weather-sunny';
    }

    if (weatherClass) {
        document.body.classList.add(weatherClass);
    }
}

async function fetchWeatherData(lat, lon, city = null) {
    if (!API_KEY || API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
        console.warn('Atenção: A chave da API não foi configurada no script.js');
        return;
    }

    const url = `${BASE_URL}onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=${currentUnit}&lang=${currentLang}&appid=${API_KEY}`;
    const airQualityUrl = `${BASE_URL}air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    try {
        const [weatherResponse, airQualityResponse] = await Promise.all([
            fetch(url),
            fetch(airQualityUrl)
        ]);

        if (!weatherResponse.ok) throw new Error(`Weather API error: ${weatherResponse.statusText}`);
        if (!airQualityResponse.ok) throw new Error(`Air Quality API error: ${airQualityResponse.statusText}`);

        const weatherData = await weatherResponse.json();
        const airQualityData = await airQualityResponse.json();

        renderWeatherData(weatherData, airQualityData, city);
        saveRecentCity(city || weatherData.timezone); 
    } catch (error) {
        console.error('Erro ao buscar dados do tempo:', error);
        alert('Não foi possível obter os dados do tempo. Verifique sua conexão ou a chave da API.');
    }
}

async function fetchCityCoords(cityName) {
    const geoUrl = `${BASE_URL}weather?q=${cityName}&appid=${API_KEY}`;
    try {
        const response = await fetch(geoUrl);
        if (!response.ok) throw new Error(`City not found: ${response.statusText}`);
        const data = await response.json();
        return { lat: data.coord.lat, lon: data.coord.lon, name: data.name };
    } catch (error) {
        console.error('Erro ao buscar coordenadas da cidade:', error);
        alert('Cidade não encontrada. Tente novamente.');
        return null;
    }
}

function renderWeatherData(data, airQualityData, cityNameOverride) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    const timezoneOffset = data.timezone_offset;

    const currentCityName = cityNameOverride || data.name || data.timezone.split('/')[1].replace('_', ' ');
    elements.currentCity.textContent = currentCityName;
    elements.currentDate.textContent = formatDate(current.dt, timezoneOffset, true);
    elements.currentTemp.textContent = getTemperatureString(current.temp);
    elements.currentWeatherIcon.className = getWeatherIconClass(current.weather[0].icon);
    elements.currentCondition.textContent = translateCondition(current.weather[0].main);
    elements.feelsLike.textContent = getTemperatureString(current.feels_like);
    elements.humidity.textContent = `${current.humidity}%`;
    elements.windSpeed.textContent = getWindSpeedString(current.wind_speed);
    elements.uvIndex.textContent = Math.round(current.uvi);
    elements.rainChance.textContent = `${daily[0].pop ? Math.round(daily[0].pop * 100) : 0}%`;
    elements.sunriseTime.textContent = formatTime(current.sunrise, timezoneOffset);
    elements.sunsetTime.textContent = formatTime(current.sunset, timezoneOffset);
    elements.airQuality.textContent = airQualityMap[airQualityData.list[0].main.aqi] || 'N/A';

    const isDay = current.dt > current.sunrise && current.dt < current.sunset;
    setDynamicBackground(current.weather[0].main.toLowerCase(), isDay);

    elements.dailyForecastList.innerHTML = '';
    if (daily && daily.length > 0) {
        daily.slice(1, 8).forEach(day => { 
            const dayCard = document.createElement('div');
            dayCard.className = 'daily-card';
            dayCard.innerHTML = `
                <div class="day">${getDayOfWeek(day.dt, timezoneOffset)}</div>
                <i class="icon ${getWeatherIconClass(day.weather[0].icon)}"></i>
                <div class="temp-range">
                    <span>${getTemperatureString(day.temp.max)}</span> / ${getTemperatureString(day.temp.min)}
                </div>
                <div class="details">
                    Chuva: ${day.pop ? Math.round(day.pop * 100) : 0}%<br>
                    Vento: ${getWindSpeedString(day.wind_speed)}<br>
                    Umidade: ${day.humidity}%
                </div>
            `;
            elements.dailyForecastList.appendChild(dayCard);
        });
    }

    elements.hourlyForecastList.innerHTML = '';
    elements.temperatureGraph.innerHTML = '';
    
    if (hourly && hourly.length > 0) {
        hourly.slice(0, 24).forEach((hour, index) => {
            const hourCard = document.createElement('div');
            hourCard.className = 'hourly-card';
            hourCard.innerHTML = `
                <div class="time">${formatTime(hour.dt, timezoneOffset)}</div>
                <i class="icon ${getWeatherIconClass(hour.weather[0].icon)}"></i>
                <div class="temp">${getTemperatureString(hour.temp)}</div>
                <div class="rain-chance">${hour.pop ? Math.round(hour.pop * 100) : 0}%</div>
            `;
            elements.hourlyForecastList.appendChild(hourCard);

            const graphBar = document.createElement('div');
            graphBar.className = 'graph-bar';
            const tempValue = Math.round(hour.temp);
            const minTemp = Math.min(...hourly.slice(0, 24).map(h => h.temp));
            const maxTemp = Math.max(...hourly.slice(0, 24).map(h => h.temp));
            const heightPercentage = ((tempValue - minTemp) / (maxTemp - minTemp + 1)) * 80 + 20; 
            graphBar.style.height = `${heightPercentage}%`;
            graphBar.innerHTML = `<span>${getTemperatureString(tempValue)}</span>`;
            elements.temperatureGraph.appendChild(graphBar);
        });
    }

    updateIntelligentMessages(current, daily[0]);
    updateWeatherAlerts(data.alerts);
}

function updateIntelligentMessages(current, todayForecast) {
    let messages = [];
    const temp = current.temp;
    const condition = current.weather[0].main.toLowerCase();
    const pop = todayForecast && todayForecast.pop ? Math.round(todayForecast.pop * 100) : 0;

    if (temp < 10) messages.push('Recomendamos um casaco pesado e luvas.');
    else if (temp < 18) messages.push('Um casaco leve ou suéter será útil.');
    else if (temp > 28) messages.push('Use roupas leves e mantenha-se hidratado.');

    if (pop > 60) messages.push('Atenção: alta probabilidade de chuva hoje. Leve um guarda-chuva!');
    if (condition.includes('thunderstorm')) messages.push('Alerta de tempestade! Procure abrigo seguro.');
    if (temp > 35) messages.push('Aviso: Temperatura muito alta. Evite exposição prolongada ao sol.');
    if (temp < 5) messages.push('Aviso: Frente fria chegando. Cuidado com a hipotermia.');

    if (messages.length === 0) {
        messages.push('O tempo está agradável. Aproveite o dia!');
    }

    elements.intelligentMessages.innerHTML = messages.map(msg => `<p><i class="fas fa-info-circle"></i> ${msg}</p>`).join('');
}

function updateWeatherAlerts(alerts) {
    if (alerts && alerts.length > 0) {
        elements.weatherAlerts.innerHTML = alerts.map(alert => `
            <div class="card" style="margin-bottom: 10px;">
                <h4>${alert.event}</h4>
                <p>De: ${alert.sender_name}</p>
                <p>${alert.description}</p>
                <small>Início: ${new Date(alert.start * 1000).toLocaleString()} - Fim: ${new Date(alert.end * 1000).toLocaleString()}</small>
            </div>
        `).join('');
    } else {
        elements.weatherAlerts.innerHTML = '<p>Nenhum alerta climático ativo no momento.</p>';
    }
}

function getGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                currentCoords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                fetchWeatherData(currentCoords.lat, currentCoords.lon);
            },
            error => {
                console.error('Erro ao obter localização:', error);
                fetchWeatherData(-23.5505, -46.6333, 'São Paulo'); 
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        fetchWeatherData(-23.5505, -46.6333, 'São Paulo'); 
    }
}

function applyTheme(themeName) {
    document.body.className = document.body.className.split(' ').filter(c => !c.startsWith('theme-')).join(' ');
    document.body.classList.add(`theme-${themeName}`);
    currentTheme = themeName;
    localStorage.setItem('weatherTheme', themeName);

    document.querySelectorAll('.theme-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.theme === themeName) {
            item.classList.add('active');
        }
    });
}

function applySettings() {
    document.querySelectorAll('#unit-selector .modal-option-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.unit === currentUnit) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('#language-selector .modal-option-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        }
    });

    elements.toggleSounds.checked = localStorage.getItem('soundsEnabled') === 'true';
    elements.toggleAnimations.checked = animationsEnabled;
    elements.toggleAutoUpdate.checked = autoUpdateEnabled;

    if (!animationsEnabled) {
        document.body.style.transition = 'none';
        document.querySelectorAll('*').forEach(el => el.style.transition = 'none');
    } else {
        document.body.style.transition = ''; 
        document.querySelectorAll('*').forEach(el => el.style.transition = '');
    }
}

function saveRecentCity(cityName) {
    if (!cityName) return;
    let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
    if (!recentCities.includes(cityName)) {
        recentCities.unshift(cityName); 
        recentCities = recentCities.slice(0, 5); 
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
    }
}

elements.searchButton.addEventListener('click', async () => {
    const cityName = elements.citySearchInput.value.trim();
    if (cityName) {
        const coords = await fetchCityCoords(cityName);
        if (coords) {
            currentCoords = { lat: coords.lat, lon: coords.lon };
            fetchWeatherData(coords.lat, coords.lon, coords.name);
        }
    }
});

elements.citySearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        elements.searchButton.click();
    }
});

elements.gpsButton.addEventListener('click', getGeolocation);

elements.openSettingsButton.addEventListener('click', () => {
    elements.settingsModalOverlay.classList.add('active');
    applySettings(); 
});

elements.closeSettingsButton.addEventListener('click', () => {
    elements.settingsModalOverlay.classList.remove('active');
});

elements.settingsModalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.settingsModalOverlay) {
        elements.settingsModalOverlay.classList.remove('active');
    }
});

elements.themeSelector.addEventListener('click', (e) => {
    const themeItem = e.target.closest('.theme-item');
    if (themeItem) {
        applyTheme(themeItem.dataset.theme);
    }
});

elements.unitSelector.addEventListener('click', (e) => {
    const button = e.target.closest('.modal-option-button');
    if (button && button.dataset.unit !== currentUnit) {
        currentUnit = button.dataset.unit;
        localStorage.setItem('weatherUnit', currentUnit);
        document.querySelectorAll('#unit-selector .modal-option-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        if (currentCoords.lat && currentCoords.lon) {
            fetchWeatherData(currentCoords.lat, currentCoords.lon, elements.currentCity.textContent);
        }
    }
});

elements.languageSelector.addEventListener('click', (e) => {
    const button = e.target.closest('.modal-option-button');
    if (button && button.dataset.lang !== currentLang) {
        currentLang = button.dataset.lang;
        localStorage.setItem('weatherLang', currentLang);
        document.querySelectorAll('#language-selector .modal-option-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        if (currentCoords.lat && currentCoords.lon) {
            fetchWeatherData(currentCoords.lat, currentCoords.lon, elements.currentCity.textContent);
        }
    }
});

elements.toggleSounds.addEventListener('change', (e) => {
    localStorage.setItem('soundsEnabled', e.target.checked);
});

elements.toggleAnimations.addEventListener('change', (e) => {
    animationsEnabled = e.target.checked;
    localStorage.setItem('animationsEnabled', animationsEnabled);
    applySettings(); 
});

elements.requestLocationPermission.addEventListener('click', () => {
    getGeolocation(); 
    alert('Tentando obter localização. Verifique o pop-up do navegador (se aplicável).');
});

elements.toggleAutoUpdate.addEventListener('change', (e) => {
    autoUpdateEnabled = e.target.checked;
    localStorage.setItem('autoUpdate', autoUpdateEnabled);
    if (autoUpdateEnabled) {
        startAutoUpdate();
    } else {
        stopAutoUpdate();
    }
});

elements.navBar.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        e.preventDefault();
        
        // Se clicar em config na navbar, abre o modal, mas não muda a aba ativa de fundo
        if (navItem.dataset.screen === 'settings') {
            elements.settingsModalOverlay.classList.add('active');
            applySettings();
            return;
        }

        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        navItem.classList.add('active');

        elements.screens.forEach(screen => screen.classList.add('hidden'));
        const targetScreenId = navItem.dataset.screen + '-screen';
        const targetScreen = document.getElementById(targetScreenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
    }
});

let autoUpdateInterval;
function startAutoUpdate() {
    if (autoUpdateEnabled && currentCoords.lat && currentCoords.lon) {
        stopAutoUpdate(); 
        autoUpdateInterval = setInterval(() => {
            fetchWeatherData(currentCoords.lat, currentCoords.lon, elements.currentCity.textContent);
        }, 10 * 60 * 1000); 
    }
}

function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }
}

// Botões funcionando e guardando no localStorage
elements.manageFavorites.addEventListener('click', () => {
    let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || [];
    const currentCity = elements.currentCity.textContent;
    
    if (currentCity === 'Carregando...') {
         alert('Aguarde carregar uma cidade primeiro.');
         return;
    }

    if (!favorites.includes(currentCity)) {
        favorites.push(currentCity);
        localStorage.setItem('favoriteCities', JSON.stringify(favorites));
        alert(`${currentCity} foi adicionada aos favoritos!`);
    } else {
        alert(`${currentCity} já está nos seus favoritos.`);
    }
});

elements.clearRecentCities.addEventListener('click', () => {
    localStorage.removeItem('recentCities');
    alert('O histórico de cidades recentes foi limpo do seu navegador.');
});

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
    applySettings(); 
    getGeolocation(); 

    if (autoUpdateEnabled) {
        startAutoUpdate();
    }
});
