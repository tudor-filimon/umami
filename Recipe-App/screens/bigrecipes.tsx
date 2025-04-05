import React from "react";
import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Define navigation route type
type Recipe = {
    imageUrl: string;
    name: string;
    ingredients: string;
    steps: string;
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
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Recipe Image with Gradient Overlay */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" />
                    <View style={styles.imageOverlay} />
                    <Text style={styles.imageTitle}>{recipe.name}</Text>
                </View>

                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Recipe Details */}
                <View style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ingredients</Text>
                        <View style={styles.divider} />
                        <Text style={styles.bodyText}>{recipe.ingredients}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Preparation Steps</Text>
                        <View style={styles.divider} />
                        <Text style={styles.bodyText}>{recipe.steps}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default BigRecipeScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    imageContainer: {
        position: "relative",
        height: 260,
    },
    image: {
        width: "100%",
        height: "100%",
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    imageTitle: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.3)",
        padding: 8,
        borderRadius: 20,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 12,
        color: "#333",
    },
    divider: {
        height: 2,
        backgroundColor: "#f0f0f0",
        marginBottom: 16,
        width: "30%",
    },
    bodyText: {
        fontSize: 16,
        color: "#444",
        lineHeight: 24,
    },
});
