import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Platform, Alert } from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { uploadImageToServer } from './UploadImageToServer';

const UploadTimetableScreen = () => {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleTakePhoto = async () => {
    launchCamera({ mediaType: 'photo', quality: 0.7 }, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri || null);
      }
    });
  };

  const handleChooseFromGallery = async () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri || null);
      }
    });
  };


  const handleConfirmUpload = async () => {
    if (!imageUri) return;
    setUploading(true);
    try {
      await uploadImageToServer(imageUri);
      Alert.alert('Success', 'Timetable image uploaded!');
    } catch (err) {
      Alert.alert('Error', 'Failed to upload image.');
    }
    setUploading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.uploadedImageBox}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <Text style={styles.placeholderText}>
                No image uploaded.{"\n"}Please upload your image.
              </Text>
            )}
          </View>
          <Text style={styles.title}>Upload Image</Text>
          <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
            <Icon name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleChooseFromGallery}>
            <Icon name="image-outline" size={20} color="#8C8CFF" style={{ marginRight: 8 }} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Choose from Gallery</Text>
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity
              style={[styles.button, uploading && { backgroundColor: '#b3b3ff' }]}
              onPress={handleConfirmUpload}
              disabled={uploading}
            >
              <Text style={styles.buttonText}>{uploading ? 'Uploading...' : 'Confirm Upload'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5ff',
  },
  card: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#8C8CFF',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  uploadedImageBox: {
    width: 260,
    height: 160,
    backgroundColor: '#e6e6ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#8C8CFF',
    overflow: 'hidden',
  },
  imagePreview: {
    width: 260,
    height: 160,
    borderRadius: 18,
    backgroundColor: '#f5f5ff',
  },
  placeholderText: {
    color: '#8C8CFF',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8C8CFF',
    marginBottom: 18,
    marginTop: 2,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C8CFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 14,
    width: 220,
    shadowColor: '#8C8CFF',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#8C8CFF',
  },
  secondaryButtonText: {
    color: '#8C8CFF',
  },
    headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8C8CFF',
    height: Platform.OS === 'ios' ? 88 : 56,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default UploadTimetableScreen;
