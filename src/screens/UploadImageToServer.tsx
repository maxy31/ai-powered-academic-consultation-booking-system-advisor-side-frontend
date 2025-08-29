import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const uploadImageToServer = async (imageUri: string) => {
  const formData = new FormData();
  // For Android, use the URI as is. For iOS, remove file:// prefix if present.
  const fileUri = Platform.OS === 'android' ? imageUri : imageUri.replace('file://', '');
  // Backend expects the multipart part name to be 'file'
  formData.append('file', {
    uri: fileUri,
    type: 'image/jpeg',
    name: 'timetable.jpg',
  });

  const token = await AsyncStorage.getItem('jwtToken');

  try {
    const response = await fetch('http://10.0.2.2:8080/api/ocr/parse-and-save', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type, let fetch set it
      },
      body: formData,
    });

    const text = await response.text(); // backend returns plain text (OCR result)
    console.log('Upload response status:', response.status);
    console.log('Upload response body:', text);
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }
    console.log('Image uploaded successfully:', text);
    return text;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};