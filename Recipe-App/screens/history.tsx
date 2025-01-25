import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, Button } from 'react-native';
import { recipeService } from '../src/recipeService';

export default function HistoryScreen() {
  const [recipes, setRecipes] = useState<Array<{
    id: string;
    title: string;
    ingredients: string[];
    instructions: string;
  }>>([]);
  
  const userId = 'LZyJfIrH0vWD9qeQHdIJ7R7nRfi2';

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

  useEffect(() => {
    fetchRecipes();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Recipe History</Text>
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
      <Button title="Refresh" onPress={fetchRecipes} />
    </View>
  );
}