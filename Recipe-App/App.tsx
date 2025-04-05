import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import LoginScreen from './screens/login';
import SignUpScreen from './screens/signup';
import CaptionScreen from './screens/caption';
import EditProfileScreen from './screens/editprofile';
import BigPostScreen from './screens/bigpost'; // Adjust the path if necessary
import BigRecipeScreen from './screens/bigrecipes'; // Adjust the path if necessary
import { colors } from './styles/globalStyles';
import HomeScreen from './screens/home';
import GenerateScreen from './screens/generate';
import PostScreen from './screens/post';
import ProfileScreen from './screens/profile';
import MessagesScreen from './screens/messages';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
  Caption: { imageUri: string };
  Messages: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#000000",
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: "#ffffff",
          elevation: 0,
          height: 110,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        headerTitleContainerStyle: {
          paddingBottom: 10,
        },
        headerTintColor: "#000831",
        headerTitleStyle: {
          fontFamily: "Inter_700Bold",
          fontSize: 24,
          color: "#000831",
          textShadowColor: "rgba(0, 0, 0, 0.1)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
        headerTitleAlign: "center",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="home"
              size={24}
              color="#000831"
              style={{ opacity: focused ? 1 : 0.5 }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Generate"
        component={GenerateScreen}
        options={{
          title: "Generate",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="search"
              size={24}
              color="#000831"
              style={{ opacity: focused ? 1 : 0.5 }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{
          title: "Post",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="add-circle"
              size={24}
              color="#000831"
              style={{ opacity: focused ? 1 : 0.5 }}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="person"
              size={24}
              color="#000831"
              style={{ opacity: focused ? 1 : 0.5 }}
            />
          ),
        }}
      />
      
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.text,
          background: colors.background,
          card: colors.navBar,
          text: colors.text,
          border: colors.text + "20",
          notification: colors.text,
        },
        fonts: {
          regular: {
            fontFamily: "Inter_400Regular",
            fontWeight: "400",
          },
          medium: {
            fontFamily: "Inter_500Medium",
            fontWeight: "500",
          },
          bold: {
            fontFamily: "Inter_700Bold",
            fontWeight: "700",
          },
          heavy: {
            fontFamily: "Inter_700Bold",
            fontWeight: "900",
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.navBar },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
          },
        }}
        initialRouteName="Main"
      >
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
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BigPost"
          component={BigPostScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Caption"
          component={CaptionScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Messages" 
          component={MessagesScreen} 
          options={{
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
