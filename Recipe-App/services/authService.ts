import { auth } from '../firebaseConfig'; // Ensure firebaseConfig is correctly set up

const authService = {
  logout: async () => {
    try {
      await auth.signOut();
      console.log('User signed out!');
    } catch (error) {
      console.error('Error signing out: ', error);
      throw error; // Re-throw the error to handle it in the calling function
    }
  },
};

export default authService; 