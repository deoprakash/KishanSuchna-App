import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTranslation } from '../context/TranslationContext';

interface LanguageSelectorProps {
  showAsButton?: boolean;
  onLanguageChange?: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  showAsButton = true, 
  onLanguageChange 
}) => {
  const { language, setLanguage, availableLanguages, t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  const handleLanguageSelect = async (languageCode: string) => {
    await setLanguage(languageCode as any);
    setShowPicker(false);
    onLanguageChange?.();
  };

  const renderLanguageItem = ({ item }: { item: typeof availableLanguages[0] }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item.code === language && styles.selectedLanguageItem
      ]}
      onPress={() => handleLanguageSelect(item.code)}
    >
      <View style={styles.languageTextContainer}>
        <Text style={[
          styles.languageName,
          item.code === language && styles.selectedLanguageText
        ]}>
          {item.name}
        </Text>
        <Text style={[
          styles.languageNativeName,
          item.code === language && styles.selectedLanguageText
        ]}>
          {item.nativeName}
        </Text>
      </View>
      {item.code === language && (
        <FontAwesome name="check" size={16} color="#008000" />
      )}
    </TouchableOpacity>
  );

  if (showAsButton) {
    return (
      <>
        <TouchableOpacity 
          style={styles.languageButton}
          onPress={() => setShowPicker(true)}
        >
          <Image 
            source={require('../assets/image/multilingual.png')} 
            style={styles.multilingualIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Modal
          visible={showPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <FontAwesome name="times" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={availableLanguages}
                keyExtractor={(item) => item.code}
                renderItem={renderLanguageItem}
                style={styles.languageList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Render as list (for settings page)
  return (
    <View style={styles.listContainer}>
      <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
      <FlatList
        data={availableLanguages}
        keyExtractor={(item) => item.code}
        renderItem={renderLanguageItem}
        style={styles.languageList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 40,
    marginRight: 15,
  },
  multilingualIcon: {
    width: 30,
    height: 30,
  },
  languageButtonText: {
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  languageFlag: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedLanguageItem: {
    backgroundColor: '#f0f8f0',
    borderWidth: 1,
    borderColor: '#008000',
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  languageNativeName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedLanguageText: {
    color: '#008000',
  },
  listContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
});

export default LanguageSelector;