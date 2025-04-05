import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { BACKEND_URL } from '../constant';
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack';

// Define your navigation parameter list
type RootStackParamList = {
  Home: undefined;
  Recipes: { recipeData: object[] };
  // Add other screens here as needed
};

type NavigationProps = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProps>();

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);

  const askGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photo library to upload images.');
      return false;
    }
    return true;
  };

  const askCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your camera to take pictures.');
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    const permissionGranted = await askGalleryPermission();
    if (permissionGranted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        await generateRecipes(result);
      }
    }
  };

  const handleCamera = async () => {
    const permissionGranted = await askCameraPermission();
    if (permissionGranted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      console.log("meow moew mmeow meow meow");

      if (!result.canceled) {
        await generateRecipes(result);
      }else{
        console.log('Image selection cancelled');
      }
    }
  };


  const generateRecipes = async (result: any) => {
    const image = result.assets[0];
    const uri = image.uri;
    const fileName = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(fileName || '');
    const type = match ? `image/${match[1]}` : `image`;
  
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('image', {
      uri,
      name: fileName,
      type,
    } as any);
  
    try {
      console.log('Uploading image...');
      const response = await fetch(BACKEND_URL + "/api/chatgpt/get-recipes", {
        method: 'POST',
        body: formData,
        // Remove Content-Type header - let React Native set it automatically
        // with the proper multipart/form-data boundary
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }
  
      const data = await response.json();
      Alert.alert('Upload Successful', 'Recipes generated!');
      
      // Navigate to the recipes screen with the generated data
      navigation.navigate('Recipes', { recipeData: data });
      console.log(data);

      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      // Alert.alert('Upload Failed', error.message || 'Something went wrong!');
      throw error;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Recipe Generator</Text>
      <Text style={styles.subtitle}>take a picture to start cooking...</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleUpload}>
          <Text style={styles.buttonText}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCamera}>
          <Text style={styles.buttonText}>Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEEB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: 'black',
    fontSize: 16,
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  footerNav: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  navIcon: {
    color: 'black',
    fontSize: 16,
  },
});

export default HomeScreen;
