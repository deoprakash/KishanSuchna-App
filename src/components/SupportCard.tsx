import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
const APP_SHARE_MESSAGE = 'Check out the Kishan Suchna app for farmers! Download now: https://your-app-link.com';

const shareApp = async () => {
  try {
    await Share.share({
      message: APP_SHARE_MESSAGE,
    });
  } catch (error) {
    Alert.alert('Error', 'Unable to share the app.');
  }
};

const dialSupport = () => {
  const telUrl = Platform.OS === 'ios' ? `telprompt:${SUPPORT_PHONE}` : `tel:${SUPPORT_PHONE}`;
  Linking.canOpenURL(telUrl)
    .then(supported => {
      if (supported) {
        Linking.openURL(telUrl);
      } else {
        Alert.alert('Unavailable', 'Phone dialer not available on this device.');
      }
    })
    .catch(() => Alert.alert('Error', 'Phone dialer not available on this device.'));
};

const openWhatsApp = () => {
  const appUrl = `whatsapp://send?phone=${SUPPORT_PHONE}`;
  const webUrl = `https://wa.me/${SUPPORT_PHONE}`;
  Linking.canOpenURL(appUrl)
    .then(canOpenApp => {
      if (canOpenApp) {
        Linking.openURL(appUrl);
      } else {
        Linking.canOpenURL(webUrl)
          .then(canOpenWeb => {
            if (canOpenWeb) {
              Linking.openURL(webUrl);
            } else {
              Alert.alert('Unavailable', 'WhatsApp not available on this device.');
            }
          });
      }
    })
    .catch(() => Alert.alert('Error', 'WhatsApp not available on this device.'));
};

const SupportCard: React.FC = () => {
  return (
    <View style={styles.container}>
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
          <FontAwesome name="whatsapp" size={22} color="#fff" />
          <Text style={styles.actionButtonText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={shareApp}
          accessibilityLabel="Share App"
        >
          <FontAwesome name="share-alt" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SupportCard;


export const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#f9f9f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // Let left side take remaining space and shrink when needed
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e6f3e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#008000',
  },
  headerTextContainer: {
    flex: 1,
    // Allow text truncation in flex row so right controls stay visible
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4d774e',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  userSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e2d',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#555',
    maxWidth: '55%',
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  shareButton: {
    backgroundColor: '#f39c12',
  },
  callButton: {
    backgroundColor: '#2ecc71',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 80,
    minHeight: 44,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // Prevent shrinking so it doesn't get pushed off-screen
    flexShrink: 0,
  },
});