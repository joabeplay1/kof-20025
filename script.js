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

// Conversor de Códigos da API Open-Meteo para Ícones
function getWmoIcon(code, isDay = true) {
    const icons = {
        0: isDay ? 'fas fa-sun' : 'fas fa-moon',
        1: isDay ? 'fas fa-sun' : 'fas fa-moon',
        2: isDay ? 'fas fa-cloud-sun' : 'fas fa-cloud-moon',
        3: 'fas fa-cloud',
        45: 'fas fa-smog',
        48: 'fas fa-smog',
        51: 'fas fa-cloud-rain',
        53: 'fas fa-cloud-rain',
        55: 'fas fa-cloud-showers-heavy',
        61: 'fas fa-cloud-rain',
        63: 'fas fa-cloud-showers-heavy',
        65: 'fas fa-cloud-showers-heavy',
        71: 'fas fa-snowflake',
        73: 'fas fa-snowflake',
        75: 'fas fa-snowflake',
        80: 'fas fa-cloud-rain',
        81: 'fas fa-cloud-showers-heavy',
        82: 'fas fa-cloud-showers-heavy',
        95: 'fas fa-bolt',
        96: 'fas fa-bolt',
        99: 'fas fa-bolt'
    };
    return icons[code] || 'fas fa-cloud';
}

function getWmoText(code) {
    const texts = {
        0: 'Céu Limpo', 1: 'Principalmente Limpo', 2: 'Parcialmente Nublado', 3: 'Nublado',
        45: 'Névoa', 48: 'Geada', 51: 'Chuvisco Leve', 53: 'Chuvisco', 55: 'Chuvisco Forte',
        61: 'Chuva Leve', 63: 'Chuva', 65: 'Chuva Forte', 71: 'Neve Leve', 73: 'Neve',
        75: 'Neve Forte', 80: 'Pancada de Chuva Leve', 81: 'Pancadas de Chuva',
        82: 'Chuva Torrencial', 95: 'Tempestade', 96: 'Tempestade com Granizo', 99: 'Tempestade Severa'
    };
    return texts[code] || 'Desconhecido';
}

function setDynamicBackground(weatherConditionText, isDay) {
    document.body.className = document.body.className.split(' ').filter(c => !c.startsWith('weather-')).join(' '); 
    const currentThemeClass = `theme-${currentTheme}`;
    if (!document.body.classList.contains(currentThemeClass)) {
        document.body.classList.add(currentThemeClass);
    }

    const condition = weatherConditionText.toLowerCase();
    let weatherClass = '';
    if (!isDay) {
        weatherClass = 'weather-night';
    } else if (condition.includes('chuva') || condition.includes('chuvisco')) {
        weatherClass = 'weather-rainy';
    } else if (condition.includes('tempestade')) {
        weatherClass = 'weather-storm';
    } else if (condition.includes('neve')) {
        weatherClass = 'weather-cold';
    } else if (condition.includes('limpo') || condition.includes('nublado')) {
        weatherClass = 'weather-sunny';
    }

    if (weatherClass) {
        document.body.classList.add(weatherClass);
    }
}

async function fetchWeatherData(lat, lon, city = null) {
    elements.currentCity.textContent = "Carregando...";
    
    const tempUnitStr = currentUnit === 'metric' ? 'celsius' : 'fahrenheit';
    const windUnitStr = currentUnit === 'metric' ? 'kmh' : 'mph';

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&temperature_unit=${tempUnitStr}&wind_speed_unit=${windUnitStr}&timezone=auto`;
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;

    try {
        const [weatherRes, aqRes] = await Promise.all([
            fetch(weatherUrl),
            fetch(aqUrl)
        ]);

        if (!weatherRes.ok) throw new Error("Erro na API de Clima");
        
        const weatherData = await weatherRes.json();
        const aqData = aqRes.ok ? await aqRes.json() : null;

        renderWeatherData(weatherData, aqData, city);
        saveRecentCity(city || "Localização Atual");
    } catch (error) {
        console.error('Erro ao buscar dados do tempo:', error);
        elements.currentCity.textContent = "Erro ao carregar";
    }
}

async function fetchCityCoords(cityName) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&language=${currentLang}&count=1`;
    try {
        const response = await fetch(geoUrl);
        if (!response.ok) throw new Error("Erro na busca de cidade");
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            const fullName = loc.admin1 ? `${loc.name}, ${loc.admin1}` : loc.name;
            return { lat: loc.latitude, lon: loc.longitude, name: fullName };
        } else {
            alert('Cidade não encontrada. Tente novamente.');
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar coordenadas da cidade:', error);
        return null;
    }
}

function renderWeatherData(data, aqData, cityNameOverride) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const currentCityName = cityNameOverride || "Localização Atual";
    elements.currentCity.textContent = currentCityName;

    const now = new Date(current.time);
    elements.currentDate.textContent = now.toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    elements.currentTemp.textContent = `${Math.round(current.temperature_2m)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    elements.currentWeatherIcon.className = getWmoIcon(current.weather_code, current.is_day);
    elements.currentCondition.textContent = getWmoText(current.weather_code);
    elements.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    elements.humidity.textContent = `${current.relative_humidity_2m}%`;
    elements.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} ${currentUnit === 'metric' ? 'km/h' : 'mph'}`;
    elements.uvIndex.textContent = daily.uv_index_max[0] ? Math.round(daily.uv_index_max[0]) : 0;
    elements.rainChance.textContent = `${daily.precipitation_probability_max[0] || 0}%`;

    elements.sunriseTime.textContent = daily.sunrise[0].split('T')[1];
    elements.sunsetTime.textContent = daily.sunset[0].split('T')[1];

    if (aqData && aqData.current) {
        const aqi = aqData.current.us_aqi;
        let aqiText = 'Boa';
        if (aqi > 50) aqiText = 'Moderada';
        if (aqi > 100) aqiText = 'Ruim';
        if (aqi > 150) aqiText = 'Muito Ruim';
        elements.airQuality.textContent = aqiText;
    } else {
        elements.airQuality.textContent = "N/A";
    }

    setDynamicBackground(getWmoText(current.weather_code), current.is_day);

    // Previsão Diária
    elements.dailyForecastList.innerHTML = '';
    for(let i = 1; i <= 6; i++) {
        const dateObj = new Date(daily.time[i] + "T00:00:00");
        const dayName = dateObj.toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'long' });

        const dayCard = document.createElement('div');
        dayCard.className = 'daily-item';
        dayCard.innerHTML = `
            <span class="day-name">${dayName.split('-')[0]}</span>
            <i class="${getWmoIcon(daily.weather_code[i], true)}"></i>
            <span class="temp-range">${Math.round(daily.temperature_2m_min[i])}° / ${Math.round(daily.temperature_2m_max[i])}°</span>
        `;
        elements.dailyForecastList.appendChild(dayCard);
    }

    // Previsão por Hora e Gráfico
    elements.hourlyForecastList.innerHTML = '';
    elements.temperatureGraph.innerHTML = '';

    const currentHourIndex = hourly.time.findIndex(t => t >= current.time);
    const startIdx = currentHourIndex > -1 ? currentHourIndex : 0;

    let temps = [];
    for(let i = startIdx; i < startIdx + 24; i++) {
        if(!hourly.time[i]) break;
        temps.push(hourly.temperature_2m[i]);
    }
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);

    for(let i = startIdx; i < startIdx + 24; i++) {
        if(!hourly.time[i]) break;
        const timeStr = hourly.time[i].split('T')[1];
        const tVal = Math.round(hourly.temperature_2m[i]);

        const hourCard = document.createElement('div');
        hourCard.className = 'hourly-item';
        hourCard.innerHTML = `
            <span class="hour-time">${timeStr}</span>
            <i class="${getWmoIcon(hourly.weather_code[i], hourly.is_day[i])}"></i>
            <span class="hour-temp">${tVal}°</span>
        `;
        elements.hourlyForecastList.appendChild(hourCard);

        const graphBar = document.createElement('div');
        graphBar.className = 'graph-bar';
        const heightPercentage = ((tVal - minTemp) / (maxTemp - minTemp + 1)) * 80 + 20; 
        graphBar.style.height = `${heightPercentage}%`;
        graphBar.style.width = '30px';
        graphBar.style.background = 'rgba(138, 43, 226, 0.7)';
        graphBar.style.marginRight = '10px';
        graphBar.style.borderRadius = '5px 5px 0 0';
        graphBar.style.display = 'inline-block';
        graphBar.style.position = 'relative';
        graphBar.innerHTML = `<span style="position: absolute; top: -20px; left: 5px; font-size: 0.8rem;">${tVal}°</span>`;
        elements.temperatureGraph.appendChild(graphBar);
    }

    updateIntelligentMessages(current.temperature_2m, daily.precipitation_probability_max[0], current.weather_code);
}

function updateIntelligentMessages(temp, pop, code) {
    let messages = [];
    const condition = getWmoText(code).toLowerCase();

    if (temp < 15) messages.push('Recomendamos um casaco ou blusa de frio.');
    else if (temp > 28) messages.push('Use roupas leves e mantenha-se hidratado.');

    if (pop > 60) messages.push('Atenção: alta probabilidade de chuva. Leve um guarda-chuva!');
    if (condition.includes('tempestade')) messages.push('Alerta de tempestade! Evite áreas abertas.');

    if (messages.length === 0) {
        messages.push('O tempo está agradável. Aproveite o dia!');
    }

    elements.intelligentMessages.innerHTML = messages.map(msg => `<p><i class="fas fa-info-circle"></i> ${msg}</p>`).join('');
}

function getGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                currentCoords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                fetchWeatherData(currentCoords.lat, currentCoords.lon, "Localização Atual");
            },
            error => {
                console.error('Erro ao obter localização:', error);
                // Fallback automático
                fetchWeatherData(-22.7661, -43.3992, 'Belford Roxo, RJ'); 
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        fetchWeatherData(-22.7661, -43.3992, 'Belford Roxo, RJ'); 
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

// === EVENT LISTENERS ===
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
    elements.settingsModalOverlay.style.display = 'flex';
    applySettings(); 
});

elements.closeSettingsButton.addEventListener('click', () => {
    elements.settingsModalOverlay.style.display = 'none';
});

elements.settingsModalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.settingsModalOverlay) {
        elements.settingsModalOverlay.style.display = 'none';
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

elements.toggleAnimations.addEventListener('change', (e) => {
    animationsEnabled = e.target.checked;
    localStorage.setItem('animationsEnabled', animationsEnabled);
    applySettings(); 
});

elements.requestLocationPermission.addEventListener('click', () => {
    getGeolocation(); 
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
        
        if (navItem.dataset.screen === 'settings') {
            elements.settingsModalOverlay.style.display = 'flex';
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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
    applySettings(); 
    getGeolocation(); 

    if (autoUpdateEnabled) {
        startAutoUpdate();
    }
    
    // Ajuste do container de gráficos para rolar horizontalmente
    elements.temperatureGraph.style.display = 'flex';
    elements.temperatureGraph.style.alignItems = 'flex-end';
    elements.temperatureGraph.style.overflowX = 'auto';
    elements.temperatureGraph.style.height = '150px';
    elements.temperatureGraph.style.paddingTop = '20px';
    elements.temperatureGraph.style.marginTop = '10px';
});
