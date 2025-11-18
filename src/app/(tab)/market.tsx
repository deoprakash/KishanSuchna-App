import { useFocusEffect } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import CommodityShareComponent from '../../components/CommodityShareComponent';
import { useTranslation } from '../../context/TranslationContext';

const MarketTab = () => {
  const { t } = useTranslation();
  const [refreshToken, setRefreshToken] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      // Increment token each time the screen gains focus
      setRefreshToken((x) => x + 1);
      return () => {};
    }, [])
  );

  return (
    <View style={{ flex: 1 }}>
      <CommodityShareComponent refreshToken={refreshToken} />
    </View>
  );
};

export default MarketTab;
