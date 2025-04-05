import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { BACKEND_URL } from '../constant';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define your navigation parameter list
type RootStackParamList = {
  Home: undefined;
  Recipes: { recipeData: object[] };
};

type NavigationProps = StackNavigationProp<RootStackParamList>;

// Define meal type options
const mealOptions = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
];

const GenerateScreen = () => {
  const navigation = useNavigation<NavigationProps>();

  const [mealType, setMealType] = useState<string>('breakfast');
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [recipes, setRecipes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

      if (!result.canceled) {
        await generateRecipes(result);
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
      setLoading(true);
      console.log('Uploading image...');
      const response = await fetch(BACKEND_URL + "/api/chatgpt/get-recipes", {
        method: 'POST',
        body: formData,
        headers: {
          'Meal-Type': mealType,
        },
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
      const err = error as Error;
      console.error('Upload failed:', err.message);
      Alert.alert('Upload Failed', err.message || 'Something went wrong!');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Recipe Generator</Text>
      <Text style={styles.subtitle}>Select a meal type and take a picture to start cooking...</Text>

      {/* Custom Meal Type Selector */}
      <View style={styles.mealTypeContainer}>
        <Text style={styles.mealTypeLabel}>Meal Type:</Text>
        <View style={styles.mealTypePills}>
          {mealOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.mealTypePill,
                mealType === option.value && styles.mealTypePillSelected
              ]}
              onPress={() => setMealType(option.value)}
            >
              <Text
                style={[
                  styles.mealTypeText,
                  mealType === option.value && styles.mealTypeTextSelected
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleUpload}>
          <Text style={styles.buttonText}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCamera}>
          <Text style={styles.buttonText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {loading && <Text style={styles.loadingText}>Loading...</Text>}

      {recipes.length > 0 && (
        <FlatList
          data={recipes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.recipeContainer}>
              <Text style={styles.recipeText}>{item}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEEB7',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    color: 'black',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  mealTypeContainer: {
    width: '90%',
    marginBottom: 30,
  },
  mealTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  mealTypePills: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  mealTypePill: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  mealTypePillSelected: {
    backgroundColor: 'black',
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  mealTypeTextSelected: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
  recipeContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  recipeText: {
    fontSize: 16,
    color: 'black',
  },
});

export default GenerateScreen;