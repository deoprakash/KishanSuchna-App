import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import WeatherComponent from '../../components/WeatherComponent';
import { useTranslation } from '../../context/TranslationContext';

const WeatherTab = () => {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // Trigger a refresh by updating the refresh trigger
      setRefreshTrigger(prev => prev + 1);
    }, [])
  );

  return (
    <View style={{ flex: 1 }}>
      <WeatherComponent refreshTrigger={refreshTrigger} />
    </View>
  );
};

export default WeatherTab;