import React, { createContext, useContext, useState, useRef } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Wind, Snowflake } from 'lucide-react';
import { safeLocalStorage } from '../lib/storage';

interface WeatherData {
  temp: number;
  condition: string;
  city: string;
  icon: React.ReactNode;
}

interface WeatherContextType {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refreshWeather: (district?: string) => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgress = useRef<string | null>(null);

  const fetchWeather = async (district: string = 'Dhaka', force: boolean = false) => {
    // Avoid double fetching same district
    if (fetchInProgress.current === district && !force) return;
    
    // Check cache first
    let cached = safeLocalStorage.getItem(`weather_${district}`);

    if (cached && !force) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 15 * 60 * 1000) { // 15 mins cache
          setWeather({ ...data, icon: getIcon(data.condition) });
          return;
        }
      } catch (e) {}
    }

    setLoading(true);
    setError(null);
    fetchInProgress.current = district;

    try {
      // 1. Geocoding with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(district + ', Bangladesh')}&count=1&language=en&format=json`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!geoRes.ok) throw new Error('Geocoding service unavailable');
      const geoData = await geoRes.json();
      
      let location = geoData.results?.[0];
      if (!location) {
        if (district !== 'Dhaka') {
          fetchInProgress.current = null;
          return fetchWeather('Dhaka');
        }
        throw new Error('Location not found');
      }

      // 2. Forecast with a timeout
      const forecastController = new AbortController();
      const forecastTimeoutId = setTimeout(() => forecastController.abort(), 8000);

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&timezone=auto`, { signal: forecastController.signal });
      clearTimeout(forecastTimeoutId);

      if (!weatherRes.ok) throw new Error('Weather service unavailable');
      const weatherData = await weatherRes.json();
      
      const temp = Math.round(weatherData.current.temperature_2m);
      const condition = getWeatherDesc(weatherData.current.weather_code);
      
      const newWeather = { temp, condition, city: location.name, icon: getIcon(condition) };
      setWeather(newWeather);
      
      safeLocalStorage.setItem(`weather_${district}`, JSON.stringify({
        data: { temp, condition, city: location.name },
        timestamp: Date.now()
      }));
    } catch (err: any) {
      // Don't log "Failed to fetch" as a scary error if we can fallback to cache
      const isNetworkError = err.name === 'AbortError' || err.message === 'Failed to fetch';
      
      let cachedAny = safeLocalStorage.getItem(`weather_${district}`);

      if (cachedAny) {
        try {
          const { data } = JSON.parse(cachedAny);
          setWeather({ ...data, icon: getIcon(data.condition) });
        } catch (e) {}
        if (isNetworkError) {
          console.warn('Weather API unreachable, using cached data.');
        } else {
          console.error('Weather Fetch Error:', err);
          setError(err.message);
        }
      } else {
        console.error('Weather Context Error:', err);
        setError(isNetworkError ? 'Weather service is temporarily unreachable.' : err.message);
      }
    } finally {
      setLoading(false);
      fetchInProgress.current = null;
    }
  };

  const getIcon = (condition: string) => {
    const lCondition = condition.toLowerCase();
    if (lCondition.includes('rain')) return <CloudRain className="text-blue-500" />;
    if (lCondition.includes('cloud')) return <Cloud className="text-gray-400" />;
    if (lCondition.includes('thunder')) return <CloudLightning className="text-purple-500" />;
    if (lCondition.includes('fog') || lCondition.includes('mist')) return <Wind className="text-teal-500 opacity-50" />;
    if (lCondition.includes('snow')) return <Snowflake className="text-blue-200" />;
    return <Sun className="text-yellow-500" />;
  };

  const getWeatherDesc = (c: number) => {
    if (c === 0) return 'Sunny';
    if (c <= 3) return 'Partly cloudy';
    if (c >= 45 && c <= 48) return 'Foggy';
    if (c >= 51 && c <= 67) return 'Light rain';
    if (c >= 71 && c <= 77) return 'Snowy';
    if (c >= 80 && c <= 82) return 'Heavy rain';
    if (c >= 95) return 'Thundery outbreaks possible';
    return 'Clear';
  };

  return (
    <WeatherContext.Provider value={{ weather, loading, error, refreshWeather: fetchWeather }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}
