import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
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

import Constants from 'expo-constants';
import { weatherStyles as styles } from '../styles/weatherStyles';

// Move getWeatherIcon above component for stable reference
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

// Move fetchWithTimeout above component for stable reference
const fetchWithTimeout = async (url: string, timeoutMs = 20000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

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
  forecast: {
    dayIndex: number;
    high: number;
    low: number;
    condition: string;
    date: string;
  }[];
}

interface WeatherComponentProps {
  refreshTrigger?: number;
}

const WeatherComponent = forwardRef<any, WeatherComponentProps>(function WeatherComponent(props, ref) {
  const { refreshTrigger } = props;
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCity, setSelectedCity] = useState<City>({ name: 'Current Location', displayName: 'Current Location', state: '' });
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  // City dropdown removed; using live location only
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const isFetchingRef = useRef(false);

  // City list removed; relying only on device location

  // OpenWeatherMap API for weather data
    const OPENWEATHER_API_KEY = Constants.expoConfig.extra?.OPENWEATHER_API_KEY;
    const fetchRealWeatherData = useCallback(async (): Promise<WeatherData> => {
      try {
        if (currentCoords) {
          const { latitude, longitude } = currentCoords;
          // Fetch current weather
          const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
          const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
          const [currentRes, forecastRes] = await Promise.all([
            fetchWithTimeout(currentUrl),
            fetchWithTimeout(forecastUrl)
          ]);
          if (!currentRes.ok || !forecastRes.ok) {
            throw new Error(`Weather API Error: ${currentRes.status} / ${forecastRes.status}`);
          }
          const currentData = await currentRes.json();
          const forecastData = await forecastRes.json();
          // Map OpenWeatherMap weather to our structure
          const condition = currentData.weather && currentData.weather[0] ? currentData.weather[0].main : 'Clear';
          const icon = getWeatherIcon(condition);
          // 5-day forecast: OpenWeatherMap gives 3-hour intervals, group by day
          const forecastByDay: { [date: string]: { high: number; low: number; condition: string; count: number } } = {};
          forecastData.list.forEach((item: any) => {
            const date = item.dt_txt.split(' ')[0];
            if (!forecastByDay[date]) {
              forecastByDay[date] = {
                high: item.main.temp_max,
                low: item.main.temp_min,
                condition: item.weather[0].main,
                count: 1
              };
            } else {
              forecastByDay[date].high = Math.max(forecastByDay[date].high, item.main.temp_max);
              forecastByDay[date].low = Math.min(forecastByDay[date].low, item.main.temp_min);
              forecastByDay[date].count++;
            }
          });
          const forecastDates = Object.keys(forecastByDay).slice(0, 5);
          const dailyForecasts = forecastDates.map((date, idx) => ({
            dayIndex: idx,
            high: Math.round(forecastByDay[date].high),
            low: Math.round(forecastByDay[date].low),
            condition: forecastByDay[date].condition,
            date
          }));
          const result: WeatherData = {
            location: `${selectedCity.displayName}${selectedCity.state ? `, ${selectedCity.state}` : ''}`,
            temperature: Math.round(currentData.main.temp),
            condition,
            humidity: currentData.main.humidity,
            windSpeed: Math.round(currentData.wind.speed),
            icon,
            forecast: dailyForecasts
          };
          try {
            await AsyncStorage.setItem('lastWeatherData', JSON.stringify(result));
            await AsyncStorage.setItem('lastWeatherUpdatedAt', new Date().toISOString());
          } catch {}
          return result;
        }
        throw new Error('No coordinates available');
      } catch (error) {
        console.error('OpenWeatherMap API Error:', error);
        throw error;
      }
    }, [currentCoords, selectedCity.displayName, selectedCity.state]);

  // Use device location to set current city/state and coords
  const enableLiveLocation = useCallback(async () => {
    try {
      // Dynamically import expo-location to avoid hard dependency if unavailable
      // @ts-ignore
      const Location = (await import('expo-location')).default || (await import('expo-location'));
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        setInitialLoadComplete(true);
        return;
      } else {
        setLocationDenied(false);
      }
      let position = null;
      try {
        position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest, maximumAge: 10000 });
      } catch (err) {
        // Retry with lower accuracy if failed
        try {
          position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, maximumAge: 30000 });
        } catch (err2) {
          setLocationDenied(true);
          setInitialLoadComplete(true);
          Alert.alert('Location', 'Unable to fetch your location. Please ensure location services are enabled.');
          return;
        }
      }
      if (!position || !position.coords) {
        setLocationDenied(true);
        setInitialLoadComplete(true);
        Alert.alert('Location', 'Unable to fetch your location. Please ensure location services are enabled.');
        return;
      }
      const { latitude, longitude } = position.coords;
      setCurrentCoords({ latitude, longitude });
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo && geo[0]) {
          // Prefer city and state, fallback to subregion if needed
          let cityName = geo[0].city || geo[0].subregion || '';
          let stateName = geo[0].region || geo[0].subregion || '';
          // If both are missing, fallback to 'Unknown Location'
          if (!cityName && !stateName) {
            cityName = 'Unknown Location';
          }
          setSelectedCity({ name: cityName, displayName: cityName, state: stateName });
        }
      } catch {}
      // Do not fetch immediately; effect will trigger when city/coords update
    } catch (e) {
      setLocationDenied(true);
      setInitialLoadComplete(true);
      Alert.alert('Location', 'Unable to fetch your location. Please ensure location services are enabled.');
    }
  }, [t]);

  // ...existing code...

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

  const fetchWeatherData = useCallback(async () => {
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
  }, [t, selectedCity.displayName, fetchRealWeatherData]);

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
  }, [enableLiveLocation]);

  useEffect(() => {
    // Fetch only when coordinates are available and valid
    if (
      currentCoords &&
      typeof currentCoords.latitude === 'number' &&
      typeof currentCoords.longitude === 'number' &&
      !isNaN(currentCoords.latitude) &&
      !isNaN(currentCoords.longitude)
    ) {
      fetchWeatherData();
    }
  }, [currentCoords, fetchWeatherData]);

  // Refresh when refreshTrigger prop changes (tab focus)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchWeatherData();
    }
  }, [refreshTrigger, fetchWeatherData]);

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

  if (locationDenied && initialLoadComplete) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-triangle" size={50} color="#ff4444" />
        <Text style={styles.errorText}>Location access is required to fetch weather updates.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }}
        >
          <Text style={styles.retryButtonText}>Grant Location Access</Text>
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