import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BACKEND_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { profileStyles as styles } from '../../styles/profileStyles';

const Profile = () => {
  const { t } = useTranslation();
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();

  const [editVisible, setEditVisible] = useState(false);
  const [name, setName] = useState<string>(user?.fullName || user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoB64, setPhotoB64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [phoneEdit, setPhoneEdit] = useState<string>(user?.phone || '');

  const userInitials = useMemo(() => {
    const name = user?.name?.trim?.() || '';
    if (!name) return '👤';
    const parts = name.split(' ').filter(Boolean);
    const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    return initials.toUpperCase();
  }, [user]);

  const openUrlSafe = async (url: string, fallbackMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unavailable', fallbackMessage);
      }
    } catch (e) {
      Alert.alert('Error', fallbackMessage);
    }
  };

  const dialSupport = () => {
    const rawNumber = '911234567890';
    const telUrl = Platform.OS === 'ios' ? `telprompt:${rawNumber}` : `tel:${rawNumber}`;
    openUrlSafe(telUrl, 'Phone dialer not available on this device.');
  };

  const openWhatsApp = async () => {
    const phone = '911234567890';
    const appUrl = `whatsapp://send?phone=${phone}`;
    const webUrl = `https://wa.me/${phone}`;
    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) {
        await Linking.openURL(appUrl);
        return;
      }
      const canOpenWeb = await Linking.canOpenURL(webUrl);
      if (canOpenWeb) {
        await Linking.openURL(webUrl);
        return;
      }
      Alert.alert('Unavailable', 'WhatsApp not available on this device.');
    } catch {
      Alert.alert('Error', 'WhatsApp not available on this device.');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm('Are you sure you want to logout?')
        : true;
      if (!confirmed) return;
      (async () => {
        try {
          await logout();
          router.replace('/(auth)/login');
        } catch {
          if (typeof window !== 'undefined') window.alert('Failed to logout. Please try again.');
        }
      })();
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openEdit = () => {
    setName(user?.fullName || user?.name || '');
    setEmail(user?.email || '');
    setPhoneEdit(user?.phone || '');
    // Keep any existing uploaded profile photo visible until the user
    // explicitly replaces or removes it. Clearing temp photo state here
    // caused the preview to disappear unexpectedly.
    setRemovePhoto(false);
    setEditVisible(true);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission required', 'We need camera access to take a photo.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ 
          base64: true, 
          quality: 0.7, 
          allowsEditing: true, 
          aspect: [1, 1] 
        });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          const a = res.assets[0];
          setPhotoUri(a.uri || null);
          if (a.base64) setPhotoB64(`data:image/jpeg;base64,${a.base64}`);
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission required', 'We need access to your photos to select a profile picture.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({ 
          base64: true, 
          quality: 0.7, 
          mediaTypes: ImagePicker.MediaTypeOptions.Images, 
          allowsEditing: true, 
          aspect: [1, 1] 
        });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          const a = res.assets[0];
          setPhotoUri(a.uri || null);
          if (a.base64) setPhotoB64(`data:image/jpeg;base64,${a.base64}`);
        }
      }
    } catch (e) {
      Alert.alert('Error', source === 'camera' ? 'Failed to open camera.' : 'Failed to open image library.');
    }
  };

  const saveProfile = async () => {
    if (!user?.phone) {
      Alert.alert('Not logged in', 'Please login again.');
      return;
    }
    try {
      setSaving(true);
      const payload: any = { phone: user.phone, fullName: name, email };
      const trimmedPhone = (phoneEdit || '').trim();
      if (trimmedPhone && trimmedPhone !== user.phone) {
        if (!/^[0-9]{10}$/.test(trimmedPhone)) {
          throw new Error('Phone must be a 10-digit number');
        }
        payload.newPhone = trimmedPhone;
      }
      if (photoB64) payload.profilePhotoB64 = photoB64;
      // If the user removed the photo in the modal, send a hint so the
      // backend can clear the stored URL. Backend will ignore unknown fields
      // so this is safe even if not implemented server-side yet.
      if (removePhoto && !photoB64) payload.profilePhotoRemove = true;

      const resp = await fetch(`${BACKEND_URL}/auth/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({} as any));
        throw new Error(body?.error || `Update failed (${resp.status})`);
      }

      const data = await resp.json();
      await updateUser({ ...data.user, name: data.user.fullName || name });
      // Clear local temporary image data after successful save. The
      // persisted `profilePhotoUrl` will be available from the updated user
      // returned by the server (and persisted by AuthContext).
      setPhotoUri(null);
      setPhotoB64(null);
      setRemovePhoto(false);
      setEditVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const avatarContent = () => {
    if (photoUri) {
      return <Image source={{ uri: photoUri }} style={{ width: 56, height: 56, borderRadius: 28 }} />
    }
    if (user?.profilePhotoUrl) {
      return <Image source={{ uri: user.profilePhotoUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} />
    }
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{userInitials}</Text>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {avatarContent()}
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Farmer'}</Text>
            {!!user?.phone && <Text style={styles.userSub}>{user?.phone}</Text>}
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={openEdit} style={{ backgroundColor: '#2ecc71', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <FontAwesome name="user" size={18} color="#008000" />
            <Text style={styles.label}>Name</Text>
          </View>
          <Text style={styles.value}>{user?.name || 'N/A'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <FontAwesome name="phone" size={18} color="#008000" />
            <Text style={styles.label}>Phone</Text>
          </View>
          <Text style={styles.value}>{user?.phone || 'N/A'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <FontAwesome name="envelope" size={18} color="#008000" />
            <Text style={styles.label}>Email</Text>
          </View>
          <Text style={styles.value}>{user?.email || 'N/A'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <FontAwesome name="clock-o" size={18} color="#008000" />
            <Text style={styles.label}>Last Login</Text>
          </View>
          <Text style={styles.value}>
            {user?.loginTime ? new Date(user.loginTime).toLocaleString() : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Support */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={dialSupport}
            accessibilityLabel="Call Support"
          >
            <FontAwesome name="phone" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={openWhatsApp}
            accessibilityLabel="WhatsApp Support"
          >
            <FontAwesome name="whatsapp" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <FontAwesome name="sign-out" size={18} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      {editVisible && (
        <Modal visible animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '90%', maxWidth: 480 }}>
              
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700' }}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditVisible(false)}><Text style={{ fontSize: 24 }}>×</Text></TouchableOpacity>
              </View>

              {/* Avatar Preview */}
              <View style={{ alignItems: 'center', marginVertical: 12 }}>
                {avatarContent()}
                
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {!photoUri ? (
                    <>
                      <TouchableOpacity onPress={() => pickImage('camera')} style={{ backgroundColor: '#e67e22', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>📷 Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => pickImage('library')} style={{ backgroundColor: '#3498db', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>📁 Upload</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity onPress={() => { setPhotoUri(null); setPhotoB64(null); setRemovePhoto(true); }} style={{ backgroundColor: '#e74c3c', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Remove Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Full Name */}
              <Text style={{ fontWeight: '600', marginTop: 4 }}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginTop: 6 }}
              />

              {/* Phone */}
              <Text style={{ fontWeight: '600', marginTop: 12 }}>Phone</Text>
              <TextInput
                keyboardType="number-pad"
                value={phoneEdit}
                onChangeText={setPhoneEdit}
                maxLength={10}
                placeholder="Enter 10-digit phone"
                style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginTop: 6 }}
              />

              {/* Email */}
              <Text style={{ fontWeight: '600', marginTop: 12 }}>Email</Text>
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginTop: 6 }}
              />

              {/* Save Buttons */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <TouchableOpacity onPress={() => setEditVisible(false)} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={saving}
                  onPress={saveProfile}
                  style={{
                    backgroundColor: saving ? '#95a5a6' : '#2ecc71',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

export default Profile;
