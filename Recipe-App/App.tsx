import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import LoginScreen from './screens/login';
import SignUpScreen from './screens/signup';
import CaptionScreen from './screens/caption';
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
          backgroundColor: colors.navBar,
          borderTopColor: colors.text + '20',
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text + '80',
        headerStyle: {
          backgroundColor: colors.navBar,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('./assets/home.png')}
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Generate" 
        component={GenerateScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('./assets/generate.png')}
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Post" 
        component={PostScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('./assets/post.png')}
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('./assets/profile.png')}
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.navBar },
          headerTintColor: colors.text
        }}
        initialRouteName="Login"
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Caption" 
          component={CaptionScreen} 
          options={{
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}