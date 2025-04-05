import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Define navigation route type

type Recipe = {
  imageUrl: string;
  name: string;
  ingredients: string;
  instructions: string;
};

type RootStackParamList = {
  BigRecipe: { recipe: Recipe };
};

type BigRecipeRouteProp = RouteProp<RootStackParamList, "BigRecipe">;

const BigRecipeScreen: React.FC = () => {
  const route = useRoute<BigRecipeRouteProp>();
  const navigation = useNavigation();
  const { recipe } = route.params;

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      {/* Recipe Image */}
      <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" />

      {/* Recipe Details */}
      <View style={styles.content}>
        <Text style={styles.title}>{recipe.name}</Text>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.bodyText}>{recipe.ingredients}</Text>

        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.bodyText}>{recipe.instructions}</Text>
      </View>
    </ScrollView>
  );
};

export default BigRecipeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 250,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
    color: "#333",
  },
  bodyText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },
});
