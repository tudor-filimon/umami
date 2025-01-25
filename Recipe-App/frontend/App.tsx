import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, Alert } from 'react-native';
import { recipeService } from './src/recipeService';

export default function App() {
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipes, setRecipes] = useState<Array<{
    id: string;
    title: string;
    ingredients: string[];
    instructions: string;
  }>>([]);
  
  // Replace with actual user ID or manage via login flow
  const userId = 'LZyJfIrH0vWD9qeQHdIJ7R7nRfi2';

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
      if (response.message === 'Recipe added successfully') {
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
      <TextInput
        placeholder="Enter Recipe Title"
        value={recipeTitle}
        onChangeText={setRecipeTitle}
        style={{ marginBottom: 10, borderWidth: 1, padding: 10 }}
      />
      <Button title="Save Recipe" onPress={saveRecipe} />
      
      <View style={{ marginTop: 20 }}>
        <Button title="Retrieve Recipes" onPress={fetchRecipes} />
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
            <Text>Ingredients: {item.ingredients.join(', ')}</Text>
            <Text>Instructions: {item.instructions}</Text>
          </View>
        )}
      />
    </View>
  );
}