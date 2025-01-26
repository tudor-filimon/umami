import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import authService from '../services/authService';
import { useNavigation } from '@react-navigation/native';
import { auth, firestore } from '../firebaseConfig'; // Ensure firebaseConfig is set up
import { doc, getDoc } from 'firebase/firestore';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState<{ name: string; age: string } | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserInfo(userDoc.data() as { name: string; age: string });
        } else {
          Alert.alert('Error', 'User data not found.');
        }
      }
    };

    fetchUserInfo();
  }, []);

  const profileDetails = [
    { title: 'Edit Profile', key: '1' },
    { title: 'Languages', key: '2' },
    { title: 'History', key: '3' },
    { title: 'Settings', key: '4' },
    { title: 'Log Out', key: '5' },
  ];

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await authService.logout();
              Alert.alert('Logged Out', 'You have been logged out successfully.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
              ]);
            } catch (error) {
              Alert.alert('Logout Error', 'An error occurred while logging out.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileInfoContainer}>
        <View style={styles.profileDetails}>
          <Text style={styles.detailText}>Name: {userInfo?.name || 'Loading...'}</Text>
          <Text style={styles.detailText}>Age: {userInfo?.age || 'Loading...'}</Text>
        </View>
      </View>

      <FlatList
        data={profileDetails}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={item.title === 'Log Out' ? handleLogout : undefined} // Call handleLogout on Log Out
          >
            <Text style={styles.optionText}>{item.title}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  profileInfoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    color: 'black',
    marginVertical: 2,
  },
  optionContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  optionText: {
    fontSize: 16,
    color: 'black',
  },
});

export default ProfileScreen;