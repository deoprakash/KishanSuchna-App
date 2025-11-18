import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BACKEND_URL } from '../../config';
import { useTranslation } from '../../context/TranslationContext';

const CameraTab = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [detectionLabel, setDetectionLabel] = useState<string | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState<number | null>(null);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Request camera permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);

  // Clear image when leaving the page
  useFocusEffect(
    useCallback(() => {
      // This runs when the screen is focused
      return () => {
        // This runs when the screen is unfocused (leaving the page)
        setCapturedImage(null);
        setIsAnalyzed(false);
      };
    }, [])
  );

  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
        Alert.alert(
          t('camera.permissionRequired'),
          t('camera.permissionMessage'),
          [{ text: t('common.ok'), style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  const handleCameraPress = async () => {
    try {
      setIsLoading(true);
      
      // Check permissions first
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert(
            t('camera.permissionRequired'),
            t('camera.cameraPermissionMessage'),
            [{ text: t('common.ok'), style: 'default' }]
          );
          setIsLoading(false);
          return;
        }
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setCapturedImage(imageUri);
        
        // Show success message
        Alert.alert(
          t('camera.captureSuccess'),
          t('camera.imageProcessing'),
          [{ text: t('common.ok'), style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        t('common.error'),
        t('camera.cameraError'),
        [{ text: t('common.ok'), style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGalleryPress = async () => {
    try {
      setIsLoading(true);
      
      // Check permissions first
      const mediaPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (mediaPermission.status !== 'granted') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert(
            t('camera.permissionRequired'),
            t('camera.galleryPermissionMessage'),
            [{ text: t('common.ok'), style: 'default' }]
          );
          setIsLoading(false);
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setCapturedImage(imageUri);
        
        // Show success message
        Alert.alert(
          t('camera.gallerySuccess'),
          t('camera.imageProcessing'),
          [{ text: t('common.ok'), style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert(
        t('common.error'),
        t('camera.galleryError'),
        [{ text: t('common.ok'), style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageRetake = () => {
    setCapturedImage(null);
    setIsAnalyzed(false);
  };

  const handleClearImage = () => {
    Alert.alert(
      t('camera.clearImage'),
      t('camera.clearImageConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('camera.clear'),
          style: 'destructive',
          onPress: () => {
            setCapturedImage(null);
            setIsAnalyzed(false);
          },
        },
      ]
    );
  };

  const handleAnalyzeImage = () => {
    // Upload the captured image to the backend and get a prediction
    if (!capturedImage) {
      Alert.alert(t('common.error'), t('camera.noImage'));
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        setDetectionLabel(null);
        setDetectionConfidence(null);
        setDetectionMessage(null);

        const formData = new FormData();

        if (Platform.OS === 'web') {
          // fetch the image as a blob then append
          const resp = await fetch(capturedImage);
          const blob = await resp.blob();
          formData.append('file', blob, 'image.jpg');
        } else {
          // React Native form file
          const filename = capturedImage.split('/').pop() || 'photo.jpg';
          const match = /\.([0-9a-z]+)(?:[?#]|$)/i.exec(filename);
          const ext = match ? match[1] : 'jpg';
          const type = ext === 'png' ? 'image/png' : 'image/jpeg';
          // @ts-ignore - React Native FormData file object
          formData.append('file', { uri: capturedImage, name: filename, type });
        }

        const res = await fetch(`${BACKEND_URL}/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error ${res.status}: ${text}`);
        }

        const data = await res.json();

        if (data.mock) {
          setDetectionMessage(data.message || 'Prediction not available');
        } else {
          setDetectionLabel(data.prediction || null);
          setDetectionConfidence(typeof data.confidence === 'number' ? data.confidence : null);
        }

        setIsAnalyzed(true);
        Alert.alert(t('camera.analysis'), t('camera.analysisComplete'), [{ text: t('common.ok') }]);
      } catch (err: any) {
        console.error('Analyze error', err);
        Alert.alert(t('common.error'), err?.message || 'Analysis failed');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('camera.title')}</Text>
          <TouchableOpacity onPress={() => setShowHelp(true)} accessibilityLabel="Camera tips">
            <FontAwesome name="info-circle" size={22} color="#2c3e50" />
          </TouchableOpacity>
        </View>
        <Text style={styles.description}>{t('camera.description')}</Text>
        
        {capturedImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            {isAnalyzed && (
              <View style={styles.detectionContainer}>
                {detectionLabel && detectionConfidence !== null ? (
                  <>
                    <Text style={styles.detectionText}>{detectionLabel}</Text>
                    <Text style={styles.confidenceText}>
                      Confidence: {detectionConfidence.toFixed(2)}%
                    </Text>
                  </>
                ) : detectionMessage ? (
                  <Text style={styles.detectionText}>{detectionMessage}</Text>
                ) : (
                  <Text style={styles.detectionText}>Analysis complete</Text>
                )}
              </View>
            )}
            <View style={styles.imageActions}>
              <TouchableOpacity 
                style={[styles.button, styles.retakeButton]} 
                onPress={handleImageRetake}
              >
                <FontAwesome name="refresh" size={20} color="white" />
                <Text style={styles.buttonText}>{t('camera.retake')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.clearButton]} 
                onPress={handleClearImage}
              >
                <FontAwesome name="trash" size={20} color="white" />
                <Text style={styles.buttonText}>{t('camera.clear')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.analyzeButton]} 
                onPress={handleAnalyzeImage}
                disabled={isLoading || isAnalyzed}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <FontAwesome name="search" size={20} color="white" />
                )}
                <Text style={styles.buttonText}>
                  {isAnalyzed ? t('camera.analyzed') : t('camera.analyze')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cameraButton]}
              onPress={handleCameraPress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <FontAwesome name="camera" size={32} color="white" />
              )}
              <Text style={styles.buttonText}>{t('camera.takePicture')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.galleryButton]}
              onPress={handleGalleryPress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <FontAwesome name="image" size={32} color="white" />
              )}
              <Text style={styles.buttonText}>{t('camera.chooseFromGallery')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{t('camera.info')}</Text>
        </View>

        {showHelp && (
          <View style={styles.helpOverlay}>
            <View style={styles.helpCard}>
              <Text style={styles.helpTitle}>{t('camera.title')}</Text>
              <Text style={styles.helpText}>
                • Place the crop in good light{"\n"}
                • Keep the camera steady{ "\n"}
                • Fill the frame with the affected area
              </Text>
              <TouchableOpacity style={[styles.button, styles.closeHelpButton]} onPress={() => setShowHelp(false)}>
                <Text style={styles.buttonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginVertical: 10,
    width: '80%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cameraButton: {
    backgroundColor: '#27ae60',
  },
  galleryButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#ecf0f1',
    padding: 20,
    borderRadius: 10,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    textAlign: 'center',
    lineHeight: 20,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  capturedImage: {
    width: 300,
    height: 300,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  detectionContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  detectionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 15,
    paddingVertical: 6,
    backgroundColor: '#e8f8f5',
    borderRadius: 6,
  },
  imageActions: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  retakeButton: {
    backgroundColor: '#e74c3c',
    width: '80%',
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#e67e22',
    width: '80%',
    marginBottom: 10,
  },
  analyzeButton: {
    backgroundColor: '#9b59b6',
    width: '80%',
  },
  helpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '85%',
    elevation: 4,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
  },
  closeHelpButton: {
    backgroundColor: '#27ae60',
    width: '100%',
  },
});

export default CameraTab;