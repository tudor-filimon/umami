import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GenerateScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate Recipe</Text>
      <Text style={styles.subtitle}>Your AI-generated recipes will appear here</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default GenerateScreen; 