const BASE_URL = 'http://172.22.31.117:4000'; 
// If you're on Android emulator, you might need 'http://10.0.2.2:5001' instead of 'localhost'.
// Adjust as needed if running on a real device or different environment.

export const recipeService = {
  saveRecipe: async (recipe: {
    title: string;
    ingredients: string[];
    instructions: string;
    user_id: string;
  }) => {
    try {
      const response = await fetch(`${BASE_URL}/api/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipe),
      });
      return await response.json();
    } catch (error: unknown) {
        console.error('Error saving recipe:', error);
      
        if (error instanceof Error) {
          // If it's an actual Error object, we can safely read `message`
          return { success: false, error: error.message };
        } else {
          // Otherwise, handle the unknown case
          return { success: false, error: 'An unknown error occurred.' };
        }
      }
  },

  getRecipes: async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/recipes/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching recipes:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: errorMessage };
    }
  },
};
