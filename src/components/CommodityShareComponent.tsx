import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { commodityShareStyles as styles } from '../styles/commodityShareStyles';

type ListingType = 'sell' | 'rent';

interface Listing {
  id: string;
  commodity: string;
  quantity: string;
  price: string;
  type: ListingType;
  createdAt: number;
  ownerPhone?: string | null;
  photoUrl?: string;
}

const STORAGE_KEY = '@commodity_listings_v1';

interface Props { refreshToken?: number }

const CommodityShareComponent: React.FC<Props> = ({ refreshToken }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showInquiriesModal, setShowInquiriesModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [commodity, setCommodity] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<ListingType>('sell');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoB64, setPhotoB64] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [remoteOk, setRemoteOk] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [newInquiryCount, setNewInquiryCount] = useState(0);
  const [notificationPolling, setNotificationPolling] = useState<any>(null);
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());
  const [lastViewedInquiriesTime, setLastViewedInquiriesTime] = useState<number>(0);

  useEffect(() => {
    loadListings();
    loadLastViewedTime();
    countNewInquiries();
    // Start polling for notifications
    checkForNotifications();
    const interval = setInterval(checkForNotifications, 15000); // every 15 seconds (reduced server load)
    setNotificationPolling(interval);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const loadLastViewedTime = async () => {
    try {
      const raw = await AsyncStorage.getItem('@last_viewed_inquiries');
      if (raw) setLastViewedInquiriesTime(parseInt(raw, 10));
    } catch (e) {
      console.error('Failed to load last viewed time', e);
    }
  };

  const checkForNotifications = async () => {
    if (!user?.phone) return;
    try {
      const resp = await fetch(`${BACKEND_URL}/get-notification?userPhone=${encodeURIComponent(user.phone)}`);
      if (resp.ok && resp.status !== 204) {
        const notif = await resp.json();
        if (notif && notif.id && notif.title) {
          // Only show if we haven't shown this notification before
          if (!shownNotifications.has(notif.id)) {
            Alert.alert(notif.title, notif.message);
            setShownNotifications(prev => new Set(prev).add(notif.id));
            // Refresh inquiry count to update badge
            await countNewInquiries();
          }
        }
      }
    } catch (e) {
      // Silent fail for notifications
    }
  };

  const countNewInquiries = async () => {
    if (!user?.phone) return;
    try {
      const inquiries = await loadInquiries();
      // Count inquiries on my listings that are newer than last viewed time
      const myListingIds = listings.filter(l => l.ownerPhone === user.phone).map(l => l.id);
      const newCount = inquiries.filter(inq => 
        myListingIds.includes(inq.listingId) && 
        inq.requesterPhone !== user.phone &&
        inq.ts > lastViewedInquiriesTime
      ).length;
      setNewInquiryCount(newCount);
    } catch (e) {
      console.error('Failed to count inquiries', e);
    }
  };

  const { user, isAuthenticated } = useAuth();

  const loadListings = async () => {
    // Try server first, then fall back to local cache
    try {
      const resp = await fetch(`${BACKEND_URL}/market/listings`);
      if (resp.ok) {
        const data = await resp.json();
        const arr = Array.isArray(data?.listings) ? data.listings : [];
        setListings(arr);
        // cache a copy locally for offline view
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        setRemoteOk(true);
        setLastUpdated(Date.now());
        return;
      }
    } catch (e) {
      console.warn('Failed to fetch remote listings, falling back to cache', e);
    }
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setListings(JSON.parse(raw));
      setRemoteOk(false);
    } catch (e) {
      console.error('Failed to load cached listings', e);
      setRemoteOk(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadListings();
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh when the parent screen gains focus (via refreshToken)
  useEffect(() => {
    if (typeof refreshToken !== 'undefined') {
      loadListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  // Refresh inquiry count when listings change or last viewed time changes
  useEffect(() => {
    countNewInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, user, lastViewedInquiriesTime]);

  const saveListings = async (newListings: Listing[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newListings));
      setListings(newListings);
    } catch (e) {
      console.error('Failed to save listings', e);
    }
  };

  const handleUpdate = (item: Listing) => {
    setSelectedListing(item);
    setCommodity(item.commodity);
    setQuantity(item.quantity);
    setPrice(item.price);
    setType(item.type);
    setPhotoUri(item.photoUrl ? item.photoUrl : null);
    setPhotoB64(null);
    setShowUpdateModal(true);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission required', 'We need camera access.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ 
          base64: true, 
          quality: 0.7, 
          allowsEditing: true, 
          aspect: [4, 3] 
        });
        if (!res.canceled && res.assets?.[0]) {
          const a = res.assets[0];
          setPhotoUri(a.uri || null);
          if (a.base64) setPhotoB64(`data:image/jpeg;base64,${a.base64}`);
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission required', 'We need photo library access.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({ 
          base64: true, 
          quality: 0.7, 
          mediaTypes: ImagePicker.MediaTypeOptions.Images, 
          allowsEditing: true, 
          aspect: [4, 3] 
        });
        if (!res.canceled && res.assets?.[0]) {
          const a = res.assets[0];
          setPhotoUri(a.uri || null);
          if (a.base64) setPhotoB64(`data:image/jpeg;base64,${a.base64}`);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleUpdateSubmit = async () => {
    if (!commodity.trim()) {
      Alert.alert('Validation', 'Please enter commodity name');
      return;
    }
    if (!selectedListing) return;

    // Delete old and create new (simple update approach)
    try {
      // Delete old
      const deleteUrl = `${BACKEND_URL}/market/listings/${selectedListing.id}?ownerPhone=${encodeURIComponent(user?.phone || '')}`;
      await fetch(deleteUrl, { method: 'DELETE' });

      // Create new
      const payload: any = {
        commodity: commodity.trim(),
        quantity: (quantity || '0').trim(),
        price: (price || '0').trim(),
        type,
        ownerPhone: user?.phone,
      };
      
      if (photoB64) {
        payload.photoB64 = photoB64;
      } else if (selectedListing?.photoUrl) {
        payload.existingPhotoUrl = selectedListing.photoUrl;
      }
      
      const resp = await fetch(`${BACKEND_URL}/market/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await resp.json().catch(() => ({} as any));
      if (!resp.ok) {
        throw new Error(body?.error || `Failed to update (${resp.status})`);
      }
      await loadListings();
      setShowUpdateModal(false);
      setCommodity('');
      setQuantity('');
      setPrice('');
      setType('sell');
      setPhotoUri(null);
      setPhotoB64(null);
      setSelectedListing(null);
    } catch (e: any) {
      console.error('Update listing failed', e);
      Alert.alert('Error', e?.message || 'Failed to update listing');
    }
  };

  const handleCreate = async () => {
    if (!commodity.trim()) {
      Alert.alert('Validation', 'Please enter commodity name');
      return;
    }
    if (!isAuthenticated || !user?.phone) {
      Alert.alert('Login required', 'Please login to create a listing.');
      return;
    }

    const payload: any = {
      commodity: commodity.trim(),
      quantity: (quantity || '0').trim(),
      price: (price || '0').trim(),
      type,
      ownerPhone: user?.phone,
    };

    if (photoB64) payload.photoB64 = photoB64;

    try {
      const resp = await fetch(`${BACKEND_URL}/market/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await resp.json().catch(() => ({} as any));
      if (!resp.ok) {
        throw new Error(body?.error || `Failed to create (${resp.status})`);
      }
      // Refresh from server to keep consistent ordering
      await loadListings();
      setShowModal(false);
      setCommodity('');
      setQuantity('');
      setPrice('');
      setType('sell');
      setPhotoUri(null);
      setPhotoB64(null);
    } catch (e: any) {
      console.error('Create listing failed', e);
      Alert.alert('Error', e?.message || 'Failed to create listing');
    }
  };

  const handleDelete = (id: string) => {
    const listing = listings.find(l => l.id === id);
    const ownerPhone = listing?.ownerPhone;

    if (!isAuthenticated) {
      Alert.alert('Not allowed', 'You must be logged in to delete listings.');
      return;
    }

    if (ownerPhone && user?.phone !== ownerPhone) {
      Alert.alert('Not allowed', 'Only the listing owner can delete this listing.');
      return;
    }

    Alert.alert('Delete', 'Delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          // Attempt server delete first
          const url = `${BACKEND_URL}/market/listings/${id}?ownerPhone=${encodeURIComponent(user?.phone || '')}`;
          const resp = await fetch(url, { method: 'DELETE' });
          if (!resp.ok) {
            const body = await resp.json().catch(() => ({} as any));
            throw new Error(body?.error || `Failed to delete (${resp.status})`);
          }
          await loadListings();
        } catch (e) {
          console.warn('Remote delete failed, updating local cache', e);
          const filtered = listings.filter(l => l.id !== id);
          await saveListings(filtered);
        }
      } }
    ]);
  };

  // Inquiries: users expressing interest in a listing
  const INQUIRY_KEY = '@commodity_inquiries_v1';

  interface Inquiry {
    listingId: string;
    ts: number;
    requesterPhone?: string;
    requesterName?: string;
  }

  const loadInquiries = async (): Promise<Inquiry[]> => {
    // Try server first, then fall back to local cache
    try {
      const resp = await fetch(`${BACKEND_URL}/market/inquiries`);
      if (resp.ok) {
        const data = await resp.json();
        const arr = Array.isArray(data?.inquiries) ? data.inquiries : [];
        // Cache locally
        await AsyncStorage.setItem(INQUIRY_KEY, JSON.stringify(arr));
        return arr;
      }
    } catch (e) {
      console.warn('Failed to fetch remote inquiries, falling back to cache', e);
    }
    // Fallback to local cache
    try {
      const raw = await AsyncStorage.getItem(INQUIRY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load inquiries', e);
      return [];
    }
  };

  const saveInquiries = async (arr: Inquiry[]) => {
    // No longer used - we save directly to backend in handleRequest
    try {
      await AsyncStorage.setItem(INQUIRY_KEY, JSON.stringify(arr));
    } catch (e) {
      console.error('Failed to save inquiries', e);
    }
  };

  const handleRequest = async (item: Listing) => {
    if (!isAuthenticated || !user?.phone) {
      Alert.alert('Login required', 'Please login to request listings.');
      return;
    }

    // Save inquiry to backend
    const inquiryPayload = {
      listingId: item.id,
      requesterPhone: user.phone,
      requesterName: user.name || user.fullName || 'User'
    };

    try {
      const resp = await fetch(`${BACKEND_URL}/market/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryPayload)
      });
      if (!resp.ok) {
        throw new Error('Failed to save inquiry');
      }
    } catch (e) {
      console.warn('Failed to save inquiry to backend, saving locally', e);
      // Fallback: save locally
      const inquiries = await loadInquiries();
      inquiries.push({ 
        listingId: item.id, 
        ts: Date.now(),
        requesterPhone: user.phone,
        requesterName: user.name || user.fullName || 'User'
      });
      await saveInquiries(inquiries);
    }

    // Send notification to owner
    if (item.ownerPhone && item.ownerPhone !== user.phone) {
      try {
        await fetch(`${BACKEND_URL}/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetPhone: item.ownerPhone,
            title: `New Request for ${item.commodity}`,
            message: `${user.name || user.fullName || 'A user'} (${user.phone}) is interested in your ${item.type === 'rent' ? 'rental' : 'sale'} listing.`,
            duration: 8
          })
        });
      } catch (e) {
        console.warn('Failed to send notification', e);
      }
    }

    // Show contact info to user
    Alert.alert(
      'Interest Recorded',
      `Contact: ${item.ownerPhone || 'N/A'}\n\nYou can contact the lister to arrange ${item.type === 'rent' ? 'rental' : 'purchase'}.\n\nYour inquiry has been saved.`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      let didCopy = false;

      console.debug('[clipboard] copyToClipboard called, text length:', String(text).length);

      try {
        // @ts-ignore: optional dynamic import, may not be installed in all environments
        console.debug('[clipboard] attempting dynamic import of expo-clipboard');
        const mod = await import('expo-clipboard');
        if (mod && (mod as any).setStringAsync) {
          await (mod as any).setStringAsync(text);
          didCopy = true;
          console.debug('[clipboard] native expo-clipboard succeeded');
        }
      } catch (err) {
        console.debug('[clipboard] expo-clipboard import failed or not installed', err);
        // module not available, fall back to web navigator
      }

      if (!didCopy) {
        console.debug('[clipboard] trying navigator.clipboard fallback');
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(text);
            didCopy = true;
            console.debug('[clipboard] navigator.clipboard.writeText succeeded');
          } catch (err) {
            console.debug('[clipboard] navigator.clipboard.writeText failed', err);
          }
        } else {
          console.debug('[clipboard] navigator.clipboard not available in this runtime');
        }
      }

      if (!didCopy) {
        console.error('[clipboard] no available clipboard method');
        throw new Error('Clipboard not available');
      }

      Alert.alert('Copied', 'Contact copied to clipboard');
    } catch (e) {
      console.error('Copy failed', e);
      Alert.alert('Error', 'Failed to copy contact');
    }
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <View style={styles.item}>
      {item.photoUrl && (
        <Image 
          source={{ uri: item.photoUrl }} 
          style={{ width: '100%', height: 180, borderRadius: 8, marginBottom: 8 }} 
          resizeMode="cover"
        />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.commodity} ({item.type.toUpperCase()})</Text>
        <Text style={styles.meta}>Qty: {item.quantity} • Price: ₹{item.price}</Text>
        {item.ownerPhone ? <Text style={styles.meta}>Owner: {item.ownerPhone}</Text> : null}
      </View>
      {user?.phone === item.ownerPhone && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity 
            onPress={() => handleUpdate(item)} 
            style={{ flex: 1, backgroundColor: '#f39c12', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDelete(item.id)} 
            style={{ flex: 1, backgroundColor: '#e74c3c', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      {user?.phone !== item.ownerPhone && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity onPress={() => handleRequest(item)} style={{ flex: 1, backgroundColor: '#27ae60', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{item.type === 'rent' ? 'Request Rent' : 'Request Buy'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => copyToClipboard(item.ownerPhone || '')} style={{ flex: 1, backgroundColor: '#2980b9', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Copy Contact</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {remoteOk === false && (
        <View style={{ backgroundColor: '#fff3cd', borderColor: '#ffeeba', borderWidth: 1, padding: 8, borderRadius: 6, marginBottom: 8 }}>
          <Text style={{ color: '#856404' }}>
            Backend unreachable — showing cached listings. Some items may be missing.
          </Text>
          <View style={{ marginTop: 6, flexDirection: 'row' }}>
            <TouchableOpacity onPress={loadListings} style={{ backgroundColor: '#f0ad4e', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
            {lastUpdated && (
              <Text style={{ marginLeft: 10, color: '#856404' }}>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</Text>
            )}
          </View>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commodity Market</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity 
            style={[styles.addBtn, { marginRight: 8, position: 'relative' }]} 
            onPress={() => { setShowInquiriesModal(true); setNewInquiryCount(0); }}
          >
            <Text style={styles.addBtnText}>Inquiries</Text>
            {newInquiryCount > 0 && (
              <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#e74c3c', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{newInquiryCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => {
            setCommodity('');
            setQuantity('');
            setPrice('');
            setType('sell');
            setPhotoUri(null);
            setPhotoB64(null);
            setShowModal(true);
          }}>
            <Text style={styles.addBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={listings}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        ListEmptyComponent={<View style={styles.empty}><Text>No listings yet. Pull to refresh or create one.</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {showModal ? (
        <Modal visible animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Listing</Text>
            
            {/* Image Upload */}
            {photoUri && (
              <Image 
                source={{ uri: photoUri }} 
                style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} 
                resizeMode="cover"
              />
            )}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {!photoUri ? (
                <>
                  <TouchableOpacity onPress={() => pickImage('camera')} style={{ flex: 1, backgroundColor: '#e67e22', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>📷 Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => pickImage('library')} style={{ flex: 1, backgroundColor: '#3498db', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>📁 Upload</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => { setPhotoUri(null); setPhotoB64(null); }} style={{ flex: 1, backgroundColor: '#e74c3c', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Remove Photo</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <TextInput placeholder="Commodity Name" value={commodity} onChangeText={setCommodity} style={styles.input} />
            <TextInput placeholder="Quantity" value={quantity} onChangeText={setQuantity} style={styles.input} keyboardType="numeric" />
            <TextInput placeholder="Price (₹)" value={price} onChangeText={setPrice} style={styles.input} keyboardType="numeric" />

            <View style={styles.typeRow}>
              <TouchableOpacity onPress={() => setType('sell')} style={[styles.typeBtn, type === 'sell' && styles.typeBtnActive]}>
                <Text style={type === 'sell' ? styles.typeTextActive : styles.typeText}>Sell</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setType('rent')} style={[styles.typeBtn, type === 'rent' && styles.typeBtnActive]}>
                <Text style={type === 'rent' ? styles.typeTextActive : styles.typeText}>Rent</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.modalBtn, { backgroundColor: '#95a5a6' }]}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={[styles.modalBtn, { backgroundColor: '#27ae60' }]}>
                <Text style={styles.modalBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {showUpdateModal ? (
        <Modal visible animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Listing</Text>
            
            {/* Image Upload */}
            {photoUri && (
              <Image 
                source={{ uri: photoUri }} 
                style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }} 
                resizeMode="cover"
              />
            )}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {!photoUri ? (
                <>
                  <TouchableOpacity onPress={() => pickImage('camera')} style={{ flex: 1, backgroundColor: '#e67e22', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>📷 Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => pickImage('library')} style={{ flex: 1, backgroundColor: '#3498db', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>📁 Upload</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => { setPhotoUri(null); setPhotoB64(null); }} style={{ flex: 1, backgroundColor: '#e74c3c', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Remove Photo</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <TextInput placeholder="Commodity Name" value={commodity} onChangeText={setCommodity} style={styles.input} />
            <TextInput placeholder="Quantity" value={quantity} onChangeText={setQuantity} style={styles.input} keyboardType="numeric" />
            <TextInput placeholder="Price (₹)" value={price} onChangeText={setPrice} style={styles.input} keyboardType="numeric" />

            <View style={styles.typeRow}>
              <TouchableOpacity onPress={() => setType('sell')} style={[styles.typeBtn, type === 'sell' && styles.typeBtnActive]}>
                <Text style={type === 'sell' ? styles.typeTextActive : styles.typeText}>Sell</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setType('rent')} style={[styles.typeBtn, type === 'rent' && styles.typeBtnActive]}>
                <Text style={type === 'rent' ? styles.typeTextActive : styles.typeText}>Rent</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setShowUpdateModal(false); setCommodity(''); setQuantity(''); setPrice(''); setType('sell'); setSelectedListing(null); }} style={[styles.modalBtn, { backgroundColor: '#95a5a6' }]}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateSubmit} style={[styles.modalBtn, { backgroundColor: '#f39c12' }]}>
                <Text style={styles.modalBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {showInquiriesModal ? (
        <Modal visible animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: '90%', maxWidth: 500 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
                <Text style={styles.modalTitle}>Inquiries</Text>
                <TouchableOpacity onPress={() => setShowInquiriesModal(false)} style={{ padding: 5 }}>
                  <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#555' }}>×</Text>
                </TouchableOpacity>
              </View>
              <InquiryList 
                listings={listings} 
                onClose={() => setShowInquiriesModal(false)}
                onViewed={async () => {
                  const now = Date.now();
                  setLastViewedInquiriesTime(now);
                  await AsyncStorage.setItem('@last_viewed_inquiries', now.toString());
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
};

export default CommodityShareComponent;

// Separate small component to render inquiries mapped to listings
interface InquiryItem {
  listingId: string;
  ts: number;
  requesterPhone?: string;
  requesterName?: string;
}

const InquiryList: React.FC<{ listings: Listing[]; onClose: () => void; onViewed: () => void }> = ({ listings, onClose, onViewed }) => {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const INQUIRY_KEY = '@commodity_inquiries_v1';
  const { user } = useAuth();

  useEffect(() => {
    load();
  }, [listings, user]);

  const load = async () => {
    try {
      // Load from backend first
      let arr = [];
      try {
        const resp = await fetch(`${BACKEND_URL}/market/inquiries`);
        if (resp.ok) {
          const data = await resp.json();
          arr = Array.isArray(data?.inquiries) ? data.inquiries : [];
        }
      } catch (e) {
        console.warn('Failed to fetch inquiries from backend, trying local', e);
        const raw = await AsyncStorage.getItem(INQUIRY_KEY);
        arr = raw ? JSON.parse(raw) : [];
      }
      
      // console.log('All inquiries:', arr);
      // console.log('User phone:', user?.phone);
      // console.log('All listings:', listings);
      // Filter to show only inquiries on the current user's listings
      const myListingIds = listings.filter(l => l.ownerPhone === user?.phone).map(l => l.id);
      // console.log('My listing IDs:', myListingIds);
      const myInquiries = arr.filter((inq: InquiryItem) => myListingIds.includes(inq.listingId));
      // console.log('My inquiries:', myInquiries);
      setInquiries(myInquiries);
      // Mark as viewed
      onViewed();
    } catch (e) {
      console.error('Failed to load inquiries', e);
    }
  };

  const render = ({ item }: { item: InquiryItem }) => {
    const listing = listings.find(l => l.id === item.listingId);
    return (
      <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 4 }}>{listing ? listing.commodity : 'Listing removed'}</Text>
        {item.requesterPhone && (
          <Text style={{ color: '#2980b9', fontWeight: '600', fontSize: 14 }}>Requester: {item.requesterName || 'User'} ({item.requesterPhone})</Text>
        )}
        <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{new Date(item.ts).toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <View style={{ maxHeight: 400 }}>
      {inquiries.length === 0 ? (
        <View style={{ padding: 16 }}><Text>No inquiries yet.</Text></View>
      ) : (
        <FlatList 
          data={inquiries} 
          keyExtractor={(i) => i.listingId + String(i.ts)} 
          renderItem={render}
          contentContainerStyle={{ paddingBottom: 10 }}
        />
      )}
    </View>
  );
};
