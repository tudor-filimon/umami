import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Animated, Easing } from 'react-native';
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
  
  // Create animation values for the loading indicator
  const spinValue = new Animated.Value(0);
  const opacityValue = new Animated.Value(0);
  
  // Start the animation when loading state changes
  useEffect(() => {
    if (loading) {
      // Fade in the loading container
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Create a continuous rotation animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Fade out when loading completes
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Stop the animation
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
  }, [loading]);
  
  // Create the interpolated rotation value
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        setLoading(true);
        try {
          await generateRecipes(result);
        } catch (error) {
          console.error('Recipe generation failed:', error);
          Alert.alert('Error', 'Failed to generate recipes. Please try again.');
        } finally {
          setLoading(false);
        }
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
        setLoading(true);
        try {
          await generateRecipes(result);
        } catch (error) {
          console.error('Recipe generation failed:', error);
          Alert.alert('Error', 'Failed to generate recipes. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
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
        <TouchableOpacity 
          style={[styles.button, loading && styles.disabledButton]} 
          onPress={handleUpload}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, loading && styles.disabledButton]} 
          onPress={handleCamera}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Loading Indicator */}
      <Animated.View 
        style={[
          styles.loadingContainer, 
          { opacity: opacityValue }
        ]}
        pointerEvents={loading ? 'auto' : 'none'}
      >
        <View style={styles.loadingContent}>
          <Animated.View 
            style={[
              styles.loadingCircle,
              { transform: [{ rotate: spin }] }
            ]}
          >
            <View style={styles.circleDot} />
          </Animated.View>
          <Text style={styles.loadingText}>Generating recipes...</Text>
          <Text style={styles.loadingSubtext}>This may take a moment</Text>
        </View>
      </Animated.View>

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
  disabledButton: {
    backgroundColor: '#666', // Grayed out when disabled
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  // Loading indicator styles
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFEEB7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  circleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#644536',
    position: 'absolute',
    top: 0,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#644536',
    marginBottom: 5,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#888',
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