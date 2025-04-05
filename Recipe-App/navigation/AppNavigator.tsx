import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import SearchUsersScreen from '../screens/searchUsers';
import MessagesScreen from '../screens/messages';
import HomeScreen from '../screens/home';
import LoginScreen from '../screens/login';
import SignUpScreen from '../screens/signUp';
import ProfileScreen from '../screens/profile';
import SettingsScreen from '../screens/settings';

// ... existing imports ...

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Group>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SearchUsers" 
          component={SearchUsersScreen}
          options={{ 
            title: 'Search Users',
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="Messages" 
          component={MessagesScreen}
          options={{ 
            headerShown: false
          }}
        />
      </Stack.Group>
      <Stack.Group>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default AppNavigator; 