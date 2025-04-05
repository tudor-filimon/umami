import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth, firestore } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SignUp"
>;

const SignUpScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const navigation = useNavigation<SignUpScreenNavigationProp>();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = userCredential.user.uid;

      await setDoc(doc(firestore, "users", userId), {
        name,
        age,
      });

      Alert.alert("Sign Up Successful", "Welcome!", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      Alert.alert("Sign Up Error", (error as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.appName}>Umami</Text>
        <Text style={styles.subtitle}>Your favorite food social network</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Create an account</Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name={name.length > 0 ? "person" : "person-outline"}
            size={20}
            color="#000831"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Name Surname"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name={age.length > 0 ? "calendar" : "calendar-outline"}
            size={20}
            color="#000831"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name={email.length > 0 ? "mail" : "mail-outline"}
            size={20}
            color="#000831"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name={password.length > 0 ? "key" : "key-outline"}
            size={20}
            color="#000831"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name={confirmPassword.length > 0 ? "key" : "key-outline"}
            size={20}
            color="#000831"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text style={styles.signupButtonText}>Sign up</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    backgroundColor: "#000831",
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.8,
  },
  formContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
    height: 50,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  signupButton: {
    backgroundColor: "#000831",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#000831",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SignUpScreen;
