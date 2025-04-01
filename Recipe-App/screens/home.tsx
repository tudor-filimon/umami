import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

const HomeScreen = () => {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [inputText, setInputText] = useState('');

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
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        Alert.alert('Image Selected', 'You have successfully chosen an image.');
        console.log(result.assets[0].uri); // Handle the selected image URI
      }
    }
  };

  const handleCamera = async () => {
    const permissionGranted = await askCameraPermission();
    if (permissionGranted) {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        Alert.alert('Image Captured', 'You have successfully taken a picture.');
        console.log(result.assets[0].uri); // Handle the captured image URI
      }
    }
  };

  const handleInputSubmit = () => {
    Alert.alert('Input Submitted', `You entered: ${inputText}`);
    setInputText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Recipe Generator</Text>
      <Text style={styles.subtitle}>Take a picture to start cooking...</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleUpload}>
          <Text style={styles.buttonText}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCamera}>
          <Text style={styles.buttonText}>Camera</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter something..."
        value={inputText}
        onChangeText={setInputText}
      />
      <TouchableOpacity style={styles.button} onPress={handleInputSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  input: {
    width: '80%',
    padding: 10,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 10,
  },
});

export default HomeScreen;