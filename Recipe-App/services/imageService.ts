import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadImage = async (uri: string): Promise<string> => {
  try {
    console.log('Starting image upload from URI:', uri);
    
    // Convert URI to blob
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const blob = await response.blob();
    console.log('Image converted to blob successfully');

    // Create a unique filename
    const filename = `posts/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    console.log('Generated filename:', filename);

    // Upload to Firebase Storage
    const storageRef = ref(storage, filename);
    const uploadResult = await uploadBytes(storageRef, blob);
    console.log('Image uploaded successfully:', uploadResult);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL generated:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 