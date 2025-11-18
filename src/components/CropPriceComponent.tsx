import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTranslation } from '../context/TranslationContext';

interface CropPrice {
  commodity: string;
  variety: string;
  grade: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  market: string;
  state: string;
  district: string;
  arrivalDate: string;
}

interface CropPriceProps {
  refreshTrigger?: number;
}

const CropPriceComponent = React.forwardRef<any, CropPriceProps>((props, ref) => {
  const { refreshTrigger } = props;
  const { t } = useTranslation();
  
  const [cropPrices, setCropPrices] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPrices, setFilteredPrices] = useState<CropPrice[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showMarketPicker, setShowMarketPicker] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // State for API-fetched filter options
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);
  const [availableCommodities, setAvailableCommodities] = useState<string[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const REQUEST_TIMEOUT_MS = 20000;

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

  const API_KEY = (process?.env?.EXPO_PUBLIC_DATA_GOV_API_KEY as string) || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

  const fetchCropPrices = async () => {
    setLoading(true);
    try {
      if (!API_KEY || API_KEY.trim().length < 10) {
        throw new Error('API key missing');
      }
      let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&limit=100&sort[arrival_date]=desc`;

      // Apply server-side filters for real-time, targeted results
      if (selectedCrop && selectedCrop !== 'All Crops') {
        url += `&filters[commodity]=${encodeURIComponent(selectedCrop)}`;
      }
      if (selectedState && selectedState !== 'All States') {
        url += `&filters[state]=${encodeURIComponent(selectedState)}`;
      }
      if (selectedDistrict && selectedDistrict !== 'All Districts') {
        url += `&filters[district]=${encodeURIComponent(selectedDistrict)}`;
      }
      if (selectedMarket && selectedMarket !== 'All Markets') {
        url += `&filters[market]=${encodeURIComponent(selectedMarket)}`;
      }

      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        let snippet = '';
        try {
          const text = await response.text();
          snippet = text?.slice(0, 140) || '';
        } catch {}
        throw new Error(`HTTP ${response.status}${snippet ? `: ${snippet}` : ''}`);
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data.records)) {
        throw new Error('Invalid API response');
      }
      
      if (data && data.records) {
        const prices: CropPrice[] = data.records.map((record: any) => ({
          commodity: record.commodity || 'Unknown',
          variety: record.variety || 'General',
          grade: record.grade || 'Standard',
          minPrice: parseFloat(record.min_price) || 0,
          maxPrice: parseFloat(record.max_price) || 0,
          modalPrice: parseFloat(record.modal_price) || 0,
          market: record.market || 'Unknown Market',
          state: record.state || 'Unknown State',
          district: record.district || 'Unknown District',
          arrivalDate: record.arrival_date || new Date().toISOString().split('T')[0]
        }));
        
        setCropPrices(prices);
        setFilteredPrices(prices);
        setLastUpdated(new Date());
      } else {
        // Fallback mock data for demonstration
        const mockPrices: CropPrice[] = [
          {
            commodity: 'Rice',
            variety: 'Basmati',
            grade: 'A',
            minPrice: 2800,
            maxPrice: 3200,
            modalPrice: 3000,
            market: 'Raipur Market',
            state: 'Chhattisgarh',
            district: 'Raipur',
            arrivalDate: new Date().toISOString().split('T')[0]
          },
          {
            commodity: 'Wheat',
            variety: 'PBW-343',
            grade: 'A',
            minPrice: 2200,
            maxPrice: 2400,
            modalPrice: 2300,
            market: 'Bilaspur Market',
            state: 'Chhattisgarh',
            district: 'Bilaspur',
            arrivalDate: new Date().toISOString().split('T')[0]
          },
          {
            commodity: 'Maize',
            variety: 'Hybrid',
            grade: 'A',
            minPrice: 1800,
            maxPrice: 2000,
            modalPrice: 1900,
            market: 'Durg Market',
            state: 'Chhattisgarh',
            district: 'Durg',
            arrivalDate: new Date().toISOString().split('T')[0]
          }
        ];
        
        setCropPrices(mockPrices);
        setFilteredPrices(mockPrices);
        setLastUpdated(new Date());
      }
      
    } catch (error: any) {
      console.error('Crop price fetch error:', error);
      const message = error?.name === 'AbortError'
        ? `${t('common.error')}: Request timed out.`
        : (error?.message?.includes('API key')
            ? 'Missing or invalid API key for data.gov.in. Please configure a valid key.'
            : `${t('cropPrice.fetchError')}${error?.message ? `\nDetails: ${error.message}` : ''}`);
      Alert.alert(t('common.error'), message, [{ text: t('common.ok'), style: 'default' }]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all available states from the API
  const fetchAllStates = async (): Promise<string[]> => {
    try {
      const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&limit=2000&fields=state&sort[state]=asc`;
      
      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data.records)) return [];
      
      if (data && data.records) {
        // Extract unique states
        const states = Array.from(new Set(
          data.records
            .map((record: any) => record.state)
            .filter((state: string) => state && state.trim() !== '')
        )).sort() as string[];
        
        return states;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  };

  // Function to fetch all available markets from the API
  const fetchAllMarkets = async (state?: string, district?: string): Promise<string[]> => {
    try {
      let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&limit=2000&fields=market,state,district&sort[market]=asc`;
      
      // Add filters if specified
      if (state && state !== 'All States') {
        url += `&filters[state]=${encodeURIComponent(state)}`;
      }
      
      if (district && district !== 'All Districts') {
        url += `&filters[district]=${encodeURIComponent(district)}`;
      }
      
      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data.records)) return [];
      
      if (data && data.records) {
        // Extract unique markets
        const markets = Array.from(new Set(
          data.records
            .map((record: any) => record.market)
            .filter((market: string) => market && market.trim() !== '')
        )).sort() as string[];
        
        return markets;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching markets:', error);
      return [];
    }
  };

  // Function to fetch all available districts from the API
  const fetchAllDistricts = async (state?: string): Promise<string[]> => {
    try {
      let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&limit=2000&fields=district,state&sort[district]=asc`;
      
      // Add state filter if specified
      if (state && state !== 'All States') {
        url += `&filters[state]=${encodeURIComponent(state)}`;
      }
      
      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data.records)) return [];
      
      if (data && data.records) {
        // Extract unique districts
        const districts = Array.from(new Set(
          data.records
            .map((record: any) => record.district)
            .filter((district: string) => district && district.trim() !== '')
        )).sort() as string[];
        
        return districts;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching districts:', error);
      return [];
    }
  };

  // Function to fetch all available commodities from the API
  const fetchAllCommodities = async (): Promise<string[]> => {
    try {
      const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&limit=2000&fields=commodity&sort[commodity]=asc`;
      
      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data.records)) return [];
      
      if (data && data.records) {
        // Extract unique commodities
        const commodities = Array.from(new Set(
          data.records
            .map((record: any) => record.commodity)
            .filter((commodity: string) => commodity && commodity.trim() !== '')
        )).sort() as string[];
        
        return commodities;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching commodities:', error);
      return [];
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters();
  }, [selectedCrop, selectedState, selectedDistrict, selectedMarket, searchQuery, cropPrices]);

  const handleRefresh = () => {
    fetchCropPrices();
  };

  const getUniqueCommodities = () => {
    if (availableCommodities.length > 0) {
      return ['All Crops', ...availableCommodities];
    }
    // Fallback to current data if API data not available
    const commodities = Array.from(new Set(cropPrices.map(price => price.commodity)));
    return ['All Crops', ...commodities.sort()];
  };

  const getUniqueStates = () => {
    if (availableStates.length > 0) {
      return ['All States', ...availableStates];
    }
    // Fallback to current data if API data not available
    const states = Array.from(new Set(cropPrices.map(price => price.state)));
    return ['All States', ...states.sort()];
  };

  const getUniqueDistricts = () => {
    if (availableDistricts.length > 0) {
      return ['All Districts', ...availableDistricts];
    }
    // Fallback to current data if API data not available
    let districts = cropPrices.map(price => price.district);
    
    // Filter by selected state if any
    if (selectedState && selectedState !== 'All States') {
      districts = cropPrices
        .filter(price => price.state === selectedState)
        .map(price => price.district);
    }
    
    const uniqueDistricts = Array.from(new Set(districts));
    return ['All Districts', ...uniqueDistricts.sort()];
  };

  const getUniqueMarkets = () => {
    if (availableMarkets.length > 0) {
      return ['All Markets', ...availableMarkets];
    }
    // Fallback to current data if API data not available
    let markets = cropPrices.map(price => price.market);
    
    // Filter by selected state and district if any
    if (selectedState && selectedState !== 'All States') {
      markets = cropPrices
        .filter(price => price.state === selectedState)
        .map(price => price.market);
    }
    
    if (selectedDistrict && selectedDistrict !== 'All Districts') {
      markets = cropPrices
        .filter(price => 
          (!selectedState || selectedState === 'All States' || price.state === selectedState) &&
          price.district === selectedDistrict
        )
        .map(price => price.market);
    }
    
    const uniqueMarkets = Array.from(new Set(markets));
    return ['All Markets', ...uniqueMarkets.sort()];
  };

  const applyFilters = () => {
    let filtered = cropPrices;

    // Apply commodity filter
    if (selectedCrop && selectedCrop !== 'All Crops') {
      filtered = filtered.filter(price => price.commodity === selectedCrop);
    }

    // Apply state filter
    if (selectedState && selectedState !== 'All States') {
      filtered = filtered.filter(price => price.state === selectedState);
    }

    // Apply district filter
    if (selectedDistrict && selectedDistrict !== 'All Districts') {
      filtered = filtered.filter(price => price.district === selectedDistrict);
    }

    // Apply market filter
    if (selectedMarket && selectedMarket !== 'All Markets') {
      filtered = filtered.filter(price => price.market === selectedMarket);
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(price =>
        price.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        price.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
        price.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
        price.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        price.state.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPrices(filtered);
  };

  const handleCommoditySelect = (commodity: string) => {
    setSelectedCrop(commodity === 'All Crops' ? '' : commodity);
    setShowCropPicker(false);
  };

  const handleStateSelect = async (state: string) => {
    setSelectedState(state === 'All States' ? '' : state);
    // Reset dependent filters when state changes
    if (state === 'All States') {
      setSelectedDistrict('');
      setSelectedMarket('');
      setAvailableDistricts([]);
      setAvailableMarkets([]);
    } else {
      // Fetch districts for the selected state
      setLoadingFilters(true);
      try {
        const districts = await fetchAllDistricts(state);
        setAvailableDistricts(districts);
        
        // Also fetch markets for the selected state
        const markets = await fetchAllMarkets(state);
        setAvailableMarkets(markets);
      } catch (error) {
        console.error('Error fetching dependent data:', error);
      } finally {
        setLoadingFilters(false);
      }
    }
    setShowStatePicker(false);
  };

  const handleDistrictSelect = async (district: string) => {
    setSelectedDistrict(district === 'All Districts' ? '' : district);
    // Reset market filter when district changes and fetch markets for the district
    if (district === 'All Districts') {
      setSelectedMarket('');
      // Fetch markets for the selected state only
      if (selectedState && selectedState !== 'All States') {
        setLoadingFilters(true);
        try {
          const markets = await fetchAllMarkets(selectedState);
          setAvailableMarkets(markets);
        } catch (error) {
          console.error('Error fetching markets:', error);
        } finally {
          setLoadingFilters(false);
        }
      }
    } else {
      // Fetch markets for the selected state and district
      setLoadingFilters(true);
      try {
        const markets = await fetchAllMarkets(selectedState || undefined, district);
        setAvailableMarkets(markets);
      } catch (error) {
        console.error('Error fetching markets:', error);
      } finally {
        setLoadingFilters(false);
      }
    }
    setShowDistrictPicker(false);
  };

  const handleMarketSelect = (market: string) => {
    setSelectedMarket(market === 'All Markets' ? '' : market);
    setShowMarketPicker(false);
  };

  const clearAllFilters = () => {
    setSelectedCrop('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedMarket('');
    setSearchQuery('');
    // Reset dependent filter options
    setAvailableDistricts([]);
    setAvailableMarkets([]);
  };

  // Initialize filter options from API
  const initializeFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      // Fetch all basic options in parallel
      const [states, commodities] = await Promise.all([
        fetchAllStates(),
        fetchAllCommodities()
      ]);
      
      setAvailableStates(states);
      setAvailableCommodities(commodities);
    } catch (error) {
      console.error('Error initializing filter options:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  // Refresh when refreshTrigger prop changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchCropPrices();
    }
  }, [refreshTrigger]);

  // Initial load
  useEffect(() => {
    fetchCropPrices();
    initializeFilterOptions(); // Initialize filter options from API
  }, []);

  // Expose refresh method to parent component
  React.useImperativeHandle(ref, () => ({
    refreshCropPrices: () => {
      fetchCropPrices();
    }
  }));

  const formatNumber = (value: number) => {
    try {
      return value.toLocaleString('en-IN');
    } catch {
      return String(value);
    }
  };

  const renderPriceCard = ({ item }: { item: CropPrice }) => (
    <View style={styles.priceCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.commodityName}>{item.commodity}</Text>
        <Text style={styles.variety}>{item.variety} - {item.grade}</Text>
      </View>
      
      <View style={styles.priceInfo}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('cropPrice.minPrice')}:</Text>
          <Text style={styles.priceValue}>₹{formatNumber(item.minPrice)} / {t('cropPrice.pricePerQuintal')}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('cropPrice.maxPrice')}:</Text>
          <Text style={styles.priceValue}>₹{formatNumber(item.maxPrice)} / {t('cropPrice.pricePerQuintal')}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('cropPrice.modalPrice')}:</Text>
          <Text style={[styles.priceValue, styles.modalPrice]}>₹{formatNumber(item.modalPrice)} / {t('cropPrice.pricePerQuintal')}</Text>
        </View>
      </View>
      
      <View style={styles.locationInfo}>
        <Text style={styles.location}>
          <FontAwesome name="map-marker" size={12} color="#7f8c8d" /> {item.market}, {item.district}, {item.state}
        </Text>
        <Text style={styles.date}>
          <FontAwesome name="calendar" size={12} color="#7f8c8d" /> {item.arrivalDate}
        </Text>
      </View>
    </View>
  );

  if (loading && cropPrices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>{t('cropPrice.fetchingPrices')}</Text>
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
        <Text style={styles.title}>{t('cropPrice.title')}</Text>
        <Text style={styles.subtitle}>{t('cropPrice.subtitle')}</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <FontAwesome name="search" size={16} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('cropPrice.searchPlaceholder')}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Filter Buttons Grid */}
      <View style={styles.filterGrid}>
        <TouchableOpacity 
          style={[styles.filterButton, styles.filterButtonSmall]}
          onPress={() => setShowStatePicker(true)}
          disabled={loadingFilters}
        >
          {loadingFilters ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesome name="map-marker" size={14} color="white" />
          )}
          <Text style={styles.filterTextSmall} numberOfLines={1}>
            {selectedState || t('cropPrice.allStates')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterButton, styles.filterButtonSmall]}
          onPress={() => setShowDistrictPicker(true)}
          disabled={loadingFilters || !selectedState}
        >
          {loadingFilters ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesome name="building" size={14} color="white" />
          )}
          <Text style={styles.filterTextSmall} numberOfLines={1}>
            {selectedDistrict || t('cropPrice.allDistricts')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterButton, styles.filterButtonSmall]}
          onPress={() => setShowMarketPicker(true)}
          disabled={loadingFilters}
        >
          {loadingFilters ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesome name="shopping-cart" size={14} color="white" />
          )}
          <Text style={styles.filterTextSmall} numberOfLines={1}>
            {selectedMarket || t('cropPrice.allMarkets')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterButton, styles.filterButtonSmall]}
          onPress={() => setShowCropPicker(true)}
          disabled={loadingFilters}
        >
          {loadingFilters ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesome name="leaf" size={14} color="white" />
          )}
          <Text style={styles.filterTextSmall} numberOfLines={1}>
            {selectedCrop || t('cropPrice.allCrops')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Clear Filters Button */}
      {(selectedState || selectedDistrict || selectedMarket || selectedCrop || searchQuery) && (
        <TouchableOpacity 
          style={styles.clearFiltersButton}
          onPress={clearAllFilters}
        >
          <FontAwesome name="times" size={14} color="#e74c3c" />
          <Text style={styles.clearFiltersText}>{t('cropPrice.clearFilters')}</Text>
        </TouchableOpacity>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <Text style={styles.lastUpdated}>
          {t('cropPrice.lastUpdated')}: {lastUpdated.toLocaleString()}
        </Text>
      )}

      {/* Crop Prices List */}
      {filteredPrices.length > 0 ? (
        <FlatList
          data={filteredPrices}
          renderItem={renderPriceCard}
          keyExtractor={(item, index) => `${item.commodity}-${item.market}-${index}`}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.noPricesContainer}>
          <FontAwesome name="exclamation-circle" size={48} color="#bdc3c7" />
          <Text style={styles.noPricesText}>{t('cropPrice.noPricesFound')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Commodity Picker Modal */}
      <Modal visible={showCropPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('cropPrice.selectCrop')}</Text>
              <TouchableOpacity onPress={() => setShowCropPicker(false)}>
                <FontAwesome name="times" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getUniqueCommodities()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.commodityItem}
                  onPress={() => handleCommoditySelect(item)}
                >
                  <Text style={styles.commodityText}>{item}</Text>
                  {(item === selectedCrop || (item === 'All Crops' && !selectedCrop)) && (
                    <FontAwesome name="check" size={16} color="#27ae60" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
          </View>
        </View>
      </Modal>

      {/* State Picker Modal */}
      <Modal visible={showStatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('cropPrice.selectState')}</Text>
              <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                <FontAwesome name="times" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getUniqueStates()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.commodityItem}
                  onPress={() => handleStateSelect(item)}
                >
                  <Text style={styles.commodityText}>{item}</Text>
                  {(item === selectedState || (item === 'All States' && !selectedState)) && (
                    <FontAwesome name="check" size={16} color="#27ae60" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
          </View>
        </View>
      </Modal>

      {/* District Picker Modal */}
      <Modal visible={showDistrictPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('cropPrice.selectDistrict')}</Text>
              <TouchableOpacity onPress={() => setShowDistrictPicker(false)}>
                <FontAwesome name="times" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getUniqueDistricts()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.commodityItem}
                  onPress={() => handleDistrictSelect(item)}
                >
                  <Text style={styles.commodityText}>{item}</Text>
                  {(item === selectedDistrict || (item === 'All Districts' && !selectedDistrict)) && (
                    <FontAwesome name="check" size={16} color="#27ae60" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
          </View>
        </View>
      </Modal>

      {/* Market Picker Modal */}
      <Modal visible={showMarketPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('cropPrice.selectMarket')}</Text>
              <TouchableOpacity onPress={() => setShowMarketPicker(false)}>
                <FontAwesome name="times" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getUniqueMarkets()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.commodityItem}
                  onPress={() => handleMarketSelect(item)}
                >
                  <Text style={styles.commodityText}>{item}</Text>
                  {(item === selectedMarket || (item === 'All Markets' && !selectedMarket)) && (
                    <FontAwesome name="check" size={16} color="#27ae60" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    padding: 20,
    backgroundColor: '#27ae60',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#2c3e50',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  priceCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 10,
    marginBottom: 10,
  },
  commodityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  variety: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  priceInfo: {
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalPrice: {
    color: '#27ae60',
    fontSize: 16,
  },
  locationInfo: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 10,
  },
  location: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 3,
  },
  date: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  noPricesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noPricesText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  commodityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  commodityText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: 'white',
    gap: 8,
  },
  filterButtonSmall: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
  },
  filterTextSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  clearFiltersText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default CropPriceComponent;