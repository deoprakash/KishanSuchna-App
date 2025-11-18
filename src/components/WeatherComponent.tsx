import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTranslation } from '../context/TranslationContext';
import { weatherStyles as styles } from '../styles/weatherStyles';

type WeatherIconName = 'sun-o' | 'cloud' | 'tint' | 'bolt';

interface City {
  name: string;
  displayName: string;
  state: string;
}

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: WeatherIconName;
  forecast: Array<{
    dayIndex: number; // Store index instead of translated string
    high: number;
    low: number;
    condition: string;
    date: string; // ISO date string (YYYY-MM-DD)
  }>;
}

interface WeatherComponentProps {
  refreshTrigger?: number;
}

const WeatherComponent = forwardRef<any, WeatherComponentProps>((props, ref) => {
  const { refreshTrigger } = props;
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCity, setSelectedCity] = useState<City>({ name: 'Current Location', displayName: 'Current Location', state: '' });
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  // City dropdown removed; using live location only
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const REQUEST_TIMEOUT_MS = 20000;
  const CITIES_CACHE_KEY = 'all_indian_cities_v1';
  const CITIES_API_URL = 'https://countriesnow.space/api/v0.1/countries/cities';
  const isFetchingRef = useRef(false);

  const fetchWithTimeout = async (url: string, timeoutMs = REQUEST_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  };

  // City list removed; relying only on device location

  // Real API call to wttr.in
  const fetchRealWeatherData = async (): Promise<WeatherData> => {
    try {
      // Prefer coordinates if available for precise location
      if (currentCoords) {
        const { latitude, longitude } = currentCoords;
        const currentResponse = await fetchWithTimeout(`https://wttr.in/${latitude},${longitude}?format=j1&days=5`);
        if (!currentResponse.ok) {
          throw new Error(`Weather API Error: ${currentResponse.status}`);
        }
        const responseText = await currentResponse.text();
        if (responseText.includes('Unknown location') || responseText.includes('Error') || !responseText.startsWith('{')) {
          throw new Error('Invalid weather data for coordinates');
        }
        const data = JSON.parse(responseText);
        if (!data.current_condition || !data.current_condition[0] || !data.weather) {
          throw new Error('Invalid weather data structure');
        }
        const current = data.current_condition[0];
        const forecast = data.weather;
        let dailyForecasts = forecast.slice(0, 5).map((day: any, index: number) => ({
          dayIndex: index,
          high: Math.round(parseInt(day.maxtempC)),
          low: Math.round(parseInt(day.mintempC)),
          condition: day.hourly[4]?.weatherDesc[0]?.value || 'Clear',
          date: day.date || new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        }));
        while (dailyForecasts.length < 5) {
          const lastDay = dailyForecasts[dailyForecasts.length - 1];
          const index = dailyForecasts.length;
          dailyForecasts.push({
            dayIndex: index,
            high: lastDay.high + Math.floor(Math.random() * 6) - 3,
            low: lastDay.low + Math.floor(Math.random() * 4) - 2,
            condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
            date: new Date(Date.parse(lastDay.date) + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          });
        }
        const result: WeatherData = {
          location: `${selectedCity.displayName}${selectedCity.state ? `, ${selectedCity.state}` : ''}`,
          temperature: Math.round(parseInt(current.temp_C)),
          condition: current.weatherDesc[0]?.value || 'Clear',
          humidity: parseInt(current.humidity),
          windSpeed: Math.round(parseInt(current.windspeedKmph)),
          icon: getWeatherIcon(current.weatherDesc[0]?.value || 'Clear'),
          forecast: dailyForecasts
        };
        try {
          await AsyncStorage.setItem('lastWeatherData', JSON.stringify(result));
          await AsyncStorage.setItem('lastWeatherUpdatedAt', new Date().toISOString());
        } catch {}
        return result;
      }

      // If no coords, defer to caller (don't try city name variations)
      throw new Error('No coordinates available');
    } catch (error) {
      console.error('wttr.in API Error:', error);
      throw error;
    }
  };

  // Use device location to set current city/state and coords
  const enableLiveLocation = async () => {
    try {
      // Dynamically import expo-location to avoid hard dependency if unavailable
      // @ts-ignore
      const Location = (await import('expo-location')).default || (await import('expo-location'));
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('camera.permissionRequired'), 'Location permission is required to fetch local weather.');
        setInitialLoadComplete(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      setCurrentCoords({ latitude, longitude });
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo && geo[0]) {
          const cityName = geo[0].city || geo[0].subregion || 'Current Location';
          const stateName = geo[0].region || geo[0].subregion || '';
          setSelectedCity({ name: cityName, displayName: cityName, state: stateName });
        }
      } catch {}
      // Do not fetch immediately; effect will trigger when city/coords update
    } catch (e) {
      console.log('Location unavailable:', e);
      setInitialLoadComplete(true);
      Alert.alert('Location', 'Unable to access location on this device.');
    }
  };

  const getWeatherIcon = (condition: string): WeatherIconName => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return 'sun-o';
    }
    if (lowerCondition.includes('cloud')) {
      return 'cloud';
    }
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
      return 'tint';
    }
    if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
      return 'bolt';
    }
    
    return 'sun-o'; // default
  };

  // Helper to format date labels like 17 Oct, 18 Oct
  const formatForecastDate = (isoDate: string): string => {
    try {
      const d = new Date(isoDate);
      const day = d.getDate();
      const month = d.toLocaleString(undefined, { month: 'short' });
      return `${day} ${month}`;
    } catch {
      return isoDate;
    }
  };

  const fetchWeatherData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchRealWeatherData();
      setWeatherData(data);
      setLastUpdated(new Date());
      setInitialLoadComplete(true);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setInitialLoadComplete(true);
      
      // Try to provide more specific error messages
      let errorMessage = t('weather.checkConnection');
      if (error instanceof Error) {
        if (error.message.includes('Location not found')) {
          errorMessage = `Weather data not available for ${selectedCity.displayName}.`;
        } else if (error.message.includes('Network')) {
          errorMessage = t('weather.checkConnection');
        } else if (error.message.includes('Invalid weather data')) {
          errorMessage = 'Weather service is temporarily unavailable. Please try again later.';
        }
      }
      
      // Try to show last cached weather if available
      try {
        const cached = await AsyncStorage.getItem('lastWeatherData');
        const cachedAt = await AsyncStorage.getItem('lastWeatherUpdatedAt');
        if (cached) {
          setWeatherData(JSON.parse(cached));
          setLastUpdated(cachedAt ? new Date(cachedAt) : null);
          Alert.alert(t('common.error'), `${errorMessage}\nShowing last saved weather.`);
          return;
        }
      } catch {}

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!currentCoords) {
      await enableLiveLocation();
    }
    if (currentCoords) fetchWeatherData();
  };

  // Removed city search handlers

  useEffect(() => {
    // Try live location on mount only; do not fallback to default city
    enableLiveLocation();
  }, []);

  useEffect(() => {
    // Fetch only when coordinates are available
    if (currentCoords) fetchWeatherData();
  }, [currentCoords]);

  // Refresh when refreshTrigger prop changes (tab focus)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && weatherData) {
      fetchWeatherData();
    }
  }, [refreshTrigger]);

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refreshWeatherData: () => {
      fetchWeatherData();
    }
  }));

  if (loading && !weatherData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008000" />
        <Text style={styles.loadingText}>{t('weather.fetchingWeather')}</Text>
      </View>
    );
  }

  if (!weatherData && initialLoadComplete) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-triangle" size={50} color="#ff4444" />
        <Text style={styles.errorText}>{t('weather.unableToLoadWeather')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!weatherData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008000" />
        <Text style={styles.loadingText}>{t('weather.fetchingWeather')}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('weather.title')}</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={loading}
        >
          <FontAwesome 
            name="refresh" 
            size={20} 
            color="#000000ff" 
            style={loading ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </View>

      {/* Location Selector */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={[styles.locationSelector, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}
        >
          <FontAwesome name="map-marker" size={16} color="#008000" />
          <Text style={styles.locationSelectorText}>
            {selectedCity.displayName}{selectedCity.state ? `, ${selectedCity.state}` : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.locationSelector, { flex: 0 }]} 
          onPress={enableLiveLocation}
          accessibilityLabel="Use current location"
        >
          <FontAwesome name="location-arrow" size={14} color="#008000" />
        </TouchableOpacity>
      </View>

      {/* Current Weather */}
      <View style={styles.currentWeatherCard}>
        <View style={styles.currentWeatherTop}>
          <View style={styles.locationContainer}>
            <FontAwesome name="map-marker" size={16} color="#666" />
            <Text style={styles.location}>{weatherData.location}</Text>
          </View>
          <FontAwesome name={weatherData.icon} size={60} color="#FFA500" />
        </View>
        
        <View style={styles.temperatureContainer}>
          <Text style={styles.temperature}>{weatherData.temperature}°C</Text>
          <Text style={styles.condition}>{weatherData.condition}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <FontAwesome name="tint" size={16} color="#4A90E2" />
            <Text style={styles.detailLabel}>{t('weather.humidity')}</Text>
            <Text style={styles.detailValue}>{weatherData.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <FontAwesome name="leaf" size={16} color="#50C878" />
            <Text style={styles.detailLabel}>{t('weather.wind')}</Text>
            <Text style={styles.detailValue}>{weatherData.windSpeed} km/h</Text>
          </View>
        </View>
      </View>

      {/* 5-Day Forecast */}
      <View style={styles.forecastCard}>
        <Text style={styles.forecastTitle}>{t('weather.forecast')}</Text>
        {weatherData.forecast.map((day, index) => (
          <View key={index} style={styles.forecastItem}>
            <Text style={styles.forecastDay}>{formatForecastDate(day.date)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 2, justifyContent: 'center' }}>
              <FontAwesome name={getWeatherIcon(day.condition)} size={16} color="#7f8c8d" style={{ marginRight: 6 }} />
              <Text style={styles.forecastCondition}>{day.condition}</Text>
            </View>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>{day.high}°</Text>
              <Text style={styles.forecastLow}>{day.low}°</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Last Updated */}
      {lastUpdated && (
        <Text style={styles.lastUpdated}>
          {t('weather.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}

      {/* Agricultural Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>{t('weather.agriculturalTips')}</Text>
        <Text style={styles.tipsText}>
          {weatherData.condition === 'Rainy' 
            ? t('weather.tips.rainy')
            : weatherData.condition === 'Sunny'
            ? t('weather.tips.sunny')
            : t('weather.tips.general')
          }
        </Text>
      </View>

      {/* City dropdown removed; live location only */}
    </ScrollView>
  );
});

export default WeatherComponent;