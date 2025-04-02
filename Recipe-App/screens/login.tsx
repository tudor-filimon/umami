import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { auth, firestore } from '../firebaseConfig'; // Import Firebase config
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import the function
import { doc, getDoc, setDoc } from 'firebase/firestore';

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  SignUp: undefined;
  // Add other screens here if needed
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const createUserIfNotExists = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(firestore, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      name: user.email?.split('@')[0] || 'New User',
      avatar: 'https://via.placeholder.com/150',
      followers: 0,
      following: 0,
      createdAt: new Date()
    });
    console.log('✅ New user profile created in Firestore');
  } else {
    console.log('ℹ️ User profile already exists');
  }
};

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await createUserIfNotExists();
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Sign Up" onPress={() => navigation.navigate('SignUp')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFEEB7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default LoginScreen;
