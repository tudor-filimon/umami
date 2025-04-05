import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, { 
  interpolate, 
  SharedValue, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
  Extrapolate
} from 'react-native-reanimated'; 
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';

type RootStackParamList = {
  Recipes: { recipeData: any };
  Main: undefined; // Added 'Main' route to fix navigation type error
};

type RecipesScreenRouteProp = RouteProp<RootStackParamList, 'Recipes'>;

const fetchRecipes = async () => {
  try {
    const response = await fetch('http://172.20.10.3:5000/api/recipes');
    const data = await response.json();
    return data;
  }
  catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
}

const saveRecipe = async (recipe: Recipe, uid: string) => {
  try {
    const response = await fetch(
      `http://172.20.10.3:5000/api/recipes/user/${uid}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          recipeId: recipe.id,
          name: recipe.name,
          image: recipe.image,
          ingredients: recipe.ingredients
        }),
      }
    );

    // First check if response is ok (status 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with status ${response.status}: ${errorText}`);
    }

    // Then try to parse as JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving recipe:', error);
    throw error;
  }
};

type Recipe = {
  id: number;
  image: string;
  name: string;
  ingredients: string;
};

type ContextType = {
  startX: number;
  startY: number;
};

const SWIPE_THRESHOLD = 120;
const ROTATION_RANGE = 20;

const RecipeCard = ({ 
  recipe, 
  numOfRecipes, 
  curIndex, 
  activeIndex, 
  index,
  onSwipeComplete 
}: { 
  recipe: Recipe, 
  numOfRecipes: number, 
  curIndex: number, 
  activeIndex: SharedValue<number>, 
  index: number,
  onSwipeComplete: () => void 
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  const panGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, ContextType>({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: (event) => {
      const isSwipedLeft = translateX.value < -SWIPE_THRESHOLD;
      const isSwipedRight = translateX.value > SWIPE_THRESHOLD;
      
      if (isSwipedLeft) {
        // Swipe out of screen
        translateX.value = withSpring(
          -500,
          { velocity: event.velocityX },
          () => {
            runOnJS(onSwipeComplete)();
          }
        );
        translateY.value = withSpring(0);
      }
      else if (isSwipedRight) {
        // Swipe out of screen
        translateX.value = withSpring(
          500,
          { velocity: event.velocityX },
          () => {
            runOnJS(onSwipeComplete)();
            // runOnJS(saveRecipe)(recipe, 'iy7CH21CAbW1R1ZUlezqlFYxgNG2'); // Replace with actual UID
          }
        );
        translateY.value = withSpring(0);
      }
      else {
        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    }
  });

  const animatedCard = useAnimatedStyle(() => {
    let isActive = activeIndex.value === index;
    const scale = interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [0.95, 1, 1],
      Extrapolate.CLAMP
    );
    
    const rotate = `${interpolate(
      translateX.value,
      [-200, 0, 200],
      [-ROTATION_RANGE, 0, ROTATION_RANGE],
      Extrapolate.CLAMP
    )}deg`;
    
    return {
      transform: [
        { scale },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate },
      ],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={panGesture}>
      <Animated.View 
        style={[
          styles.card, 
          animatedCard,
          { 
            zIndex: numOfRecipes - curIndex,
          },
        ]}
      >
        <View style={styles.top}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.cardImage}
          />
        </View>
        <View style={styles.bottom}>
          <Text style={styles.headerText}>{recipe.name}</Text>
          <Text style={styles.normalText}>Ingredients: {recipe.ingredients}</Text>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const RecipePage = () => {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const activeIndex = useSharedValue(0);
  const navigation = useNavigation(); // Get navigation object
  const route = useRoute<RecipesScreenRouteProp>();

  React.useEffect(() => {
    const loadRecipes = async () => {
      try {
        const data = await fetchRecipes();
        setRecipes(data);
      } catch (error) {
        console.error('Error loading recipes:', error);
      }
    };

    // Check if we have recipeData from navigation params
    if (route.params?.recipeData) {
      console.log("Received recipe data from navigation:", JSON.stringify(route.params.recipeData, null, 2));
      
      try {
        const recipesData = route.params.recipeData.recipes;
        
        if (recipesData && recipesData.length > 0) {
          // The response might be a string containing raw JSON or a JSON array directly
          let processedRecipes = [];
          
          try {
            // Try to parse each recipe in the array
            for (let i = 0; i < recipesData.length; i++) {
              const recipeData = recipesData[i];
              
              try {
                // Try parsing as JSON
                const parsedRecipe = JSON.parse(recipeData);
                
                // Check various possible formats
                if (Array.isArray(parsedRecipe)) {
                  // Format: array of recipe objects
                  processedRecipes = parsedRecipe.map((recipe, index) => ({
                    id: index,
                    name: recipe.name || `Recipe ${index + 1}`,
                    ingredients: Array.isArray(recipe.ingredients) 
                      ? recipe.ingredients.join(', ') 
                      : recipe.ingredients || '',
                    image: "https://via.placeholder.com/318"
                  }));
                  break;
                } else if (parsedRecipe.recipes && Array.isArray(parsedRecipe.recipes)) {
                  // Format: { recipes: [...] }
                  processedRecipes = parsedRecipe.recipes.map((recipe: { name: any; ingredients: any[]; }, index: number) => ({
                    id: index,
                    name: recipe.name || `Recipe ${index + 1}`,
                    ingredients: Array.isArray(recipe.ingredients)
                      ? recipe.ingredients.join(', ')
                      : recipe.ingredients || '',
                    image: "https://via.placeholder.com/318"
                  }));
                  break;
                } else if (parsedRecipe.recipe1 || parsedRecipe.recipe2 || parsedRecipe.recipe3) {
                  // Format: { recipe1: {...}, recipe2: {...} }
                  const recipeKeys = Object.keys(parsedRecipe).filter(key => key.includes('recipe'));
                  processedRecipes = recipeKeys.map((key, index) => {
                    const recipe = parsedRecipe[key];
                    return {
                      id: index,
                      name: recipe.name || `Recipe ${index + 1}`,
                      ingredients: Array.isArray(recipe.ingredients)
                        ? recipe.ingredients.join(', ')
                        : recipe.ingredients || '',
                      image: "https://via.placeholder.com/318"
                    };
                  });
                  break;
                } else if (parsedRecipe.name && (parsedRecipe.ingredients || parsedRecipe.steps)) {
                  // It's a single recipe
                  processedRecipes.push({
                    id: 0,
                    name: parsedRecipe.name,
                    ingredients: Array.isArray(parsedRecipe.ingredients)
                      ? parsedRecipe.ingredients.join(', ')
                      : parsedRecipe.ingredients || '',
                    image: "https://via.placeholder.com/318"
                  });
                }
              } catch (parseError) {
                // Not valid JSON, try to extract recipe info from text
                console.log(`Recipe ${i} is not valid JSON, trying text extraction`);
                
                // Try to extract recipes using regex from plain text
                const text = recipeData;
                const recipeMatches = text.match(/Recipe \d+:(.+?)(?=Recipe \d+:|$)/gs) || 
                                      text.match(/\d+\.\s(.+?)(?=\d+\.\s|$)/gs);
                
                if (recipeMatches) {
                    // Define typed model for extracted recipe
                    interface ExtractedRecipe {
                    id: number;
                    name: string;
                    ingredients: string;
                    image: string;
                    }
                    
                    recipeMatches.forEach((match: string, index: number) => {
                    // Extract name (usually first line)
                    const nameMatch: RegExpMatchArray | null = match.match(/^(.*?)(?:\n|$)/);
                    const name: string = nameMatch ? nameMatch[1].trim() : `Recipe ${index + 1}`;
                    
                    // Extract ingredients section
                    const ingredientsMatch: RegExpMatchArray | null = match.match(/Ingredients:([^]*?)(?:Instructions:|Steps:|Directions:|$)/i);
                    const ingredients: string = ingredientsMatch ? ingredientsMatch[1].trim() : '';
                    
                    processedRecipes.push({
                      id: processedRecipes.length,
                      name: name,
                      ingredients: ingredients,
                      image: "https://via.placeholder.com/318"
                    } as ExtractedRecipe);
                    });
                }
              }
            }
          } catch (error) {
            console.error("Error in recipe parsing loop:", error);
          }
          
          // If we still don't have recipes, try plain text extraction as a fallback
          if (processedRecipes.length === 0) {
            // Basic fallback: create recipe cards from whatever text is available
            processedRecipes = recipesData.map((recipeText: string, index: number) => {
              return {
                id: index,
                name: `Recipe ${index + 1}`,
                ingredients: typeof recipeText === 'string' ? recipeText.substring(0, 200) + '...' : 'No ingredients available',
                image: "https://via.placeholder.com/318"
              };
            });
          }
          
          if (processedRecipes.length > 0) {
            setRecipes(processedRecipes);
          } else {
            // If all parsing attempts failed, load default recipes
            loadRecipes();
          }
        } else {
          console.error("No valid recipes data found in navigation params");
          loadRecipes();
        }
      } catch (error) {
        console.error("Error processing recipe data:", error);
        loadRecipes();
      }
    } else {
      // If no data from navigation, load recipes from API
      loadRecipes();
    }
  }, [route.params]);
  
  const handleSwipeComplete = () => {
    activeIndex.value = withSpring(activeIndex.value + 1, {
      stiffness: 200,
      damping: 15,
      mass: 0.5
    });

    // Check if this was the last card
    if (activeIndex.value + 1 >= recipes.length - 1) {
      // Add a small delay for better UX
      setTimeout(() => {
        // navigation.goBack(); // should use navigation go back
        navigation.navigate('Main');
      }, 500);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>No more recipes :)</Text>
        </View>
      ) : (
        recipes.map((recipe, index) => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe} 
            numOfRecipes={recipes.length} 
            curIndex={index - activeIndex.value}
            activeIndex={activeIndex}
            index={index}
            onSwipeComplete={handleSwipeComplete}
          />
        ))
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEFB6',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '75%',
    width: '100%',
  },
  bottom: {
    height: '25%',
    width: '100%',
    paddingLeft: 15,
  },
  card: {
    backgroundColor: '#C4A381',
    borderRadius: 23,
    padding: 10,
    width: 364,
    height: 472,
    alignItems: 'center',
    marginHorizontal: 10,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#644536',
  },
  normalText: {
    fontSize: 12,
    color: '#644536',
  },
  cardImage: {
    width: 318,
    height: 318,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 23,
  },
});

export default RecipePage;