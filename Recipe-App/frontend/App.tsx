import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, Alert } from 'react-native';
import { recipeService } from './src/recipeService'; // Import the recipe service

export default function App() {
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipes, setRecipes] = useState<{ id: string; title: string }[]>([]);
  const userId = 'exampleUserId'; // Replace with a real user ID if needed

  const saveRecipe = async () => {
    if (!recipeTitle.trim()) {
      Alert.alert('Error', 'Recipe title cannot be empty.');
      return;
    }

    try {
      const response = await recipeService.saveRecipe({
        title: recipeTitle,
        ingredients: [],
        instructions: '',
        user_id: userId,
      });

      if (response.success) {
        Alert.alert('Success', 'Recipe saved successfully!');
        setRecipeTitle('');
      } else {
        Alert.alert('Error', response.error || 'Failed to save the recipe.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving the recipe.');
    }
  };

  const fetchRecipes = async () => {
    try {
      const response = await recipeService.getRecipes(userId);
      if (response.success) {
        setRecipes(response.recipes);
      } else {
        Alert.alert('Error', response.error || 'Failed to retrieve recipes.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while fetching recipes.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Input field for the recipe title */}
      <TextInput
        placeholder="Enter Recipe Title"
        value={recipeTitle}
        onChangeText={setRecipeTitle}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      {/* Button to save the recipe */}
      <Button title="Save Recipe" onPress={saveRecipe} />

      {/* Button to retrieve recipes */}
      <View style={{ marginTop: 20 }}>
        <Button title="Retrieve Recipes" onPress={fetchRecipes} />
      </View>

      {/* Display list of retrieved recipes */}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginTop: 10, padding: 10, borderBottomWidth: 1 }}>
            <Text>{item.title}</Text>
          </View>
        )}
      />
    </View>
  );
}
