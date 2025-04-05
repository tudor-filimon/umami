// Full updated ProfileScreen with Edit Profile modal re-added

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, firestore } from '../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  DocumentData,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadImage } from '../services/imageService';

interface UserInfo {
  name: string;
  age?: string;
  pronouns?: string;
  profileImage?: string;
  followersCount?: number;
  followingCount?: number;
}

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
  Caption: { imageUri: string };
};

const screenWidth = Dimensions.get('window').width;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', pronouns: '', followersCount: 0, followingCount: 0 });
  const [posts, setPosts] = useState<DocumentData[]>([]);
  const [selectedTab, setSelectedTab] = useState<'posts' | 'saved'>('posts');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPronouns, setEditPronouns] = useState('');
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchUserInfo = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserInfo({
          name: userData.name || '',
          pronouns: userData.pronouns || '',
          profileImage: userData.profileImage || undefined,
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
        });
      } else {
        await setDoc(userRef, {
          name: currentUser.displayName || 'New User',
          pronouns: '',
          profileImage: undefined,
          followersCount: 0,
          followingCount: 0,
          createdAt: new Date(),
        });
        setUserInfo({ name: currentUser.displayName || 'New User', pronouns: '', profileImage: undefined, followersCount: 0, followingCount: 0 });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      Alert.alert('Error', 'Failed to load user information');
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userRef = doc(firestore, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setUserInfo({
          name: userData.name || '',
          pronouns: userData.pronouns || '',
          profileImage: userData.profileImage || undefined,
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserPosts = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const q = query(collection(firestore, 'posts'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const userPosts = querySnapshot.docs.map((doc) => doc.data()).filter((post) => !!post.imageUrl);
      setPosts(userPosts);
    }
  };

  useFocusEffect(React.useCallback(() => {
    fetchUserInfo();
    fetchUserPosts();
  }, []));

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: async () => {
        try {
          await auth.signOut();
          navigation.navigate('Login');
        } catch (error) {
          Alert.alert('Error', 'Logout failed.');
        }
      } },
    ]);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setUploading(true);
        const imageUrl = await uploadImage(result.assets[0].uri);
        setEditProfileImage(imageUrl);
        setUploading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      setLoading(true);
      await updateDoc(doc(firestore, 'users', currentUser.uid), {
        name: editName,
        pronouns: editPronouns,
        profileImage: editProfileImage,
      });
      setShowEditProfile(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const openEditProfile = () => {
    setEditName(userInfo.name);
    setEditPronouns(userInfo.pronouns || '');
    setEditProfileImage(userInfo.profileImage || null);
    setShowEditProfile(true);
  };

  const renderPost = ({ item }: { item: DocumentData }) => (
    <Image source={{ uri: item.imageUrl }} style={{ width: screenWidth / 3 - 4, height: screenWidth / 3, margin: 1 }} resizeMode="cover" />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Image source={{ uri: 'https://placehold.co/400x120/png?text=Banner' }} style={{ width: '100%', height: 120 }} />
      <View style={{ alignItems: 'center', marginTop: -40 }}>
        <Image source={{ uri: userInfo.profileImage || 'https://placehold.co/100x100?text=User' }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#fff' }} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111', marginTop: 8 }}>{userInfo.name}</Text>
        {userInfo.pronouns ? <Text style={{ fontSize: 14, color: '#555' }}>({userInfo.pronouns})</Text> : null}
        <View style={{ flexDirection: 'row', marginTop: 6 }}>
          <Text style={{ fontSize: 14, color: '#666', marginHorizontal: 10 }}>{userInfo.followersCount} followers</Text>
          <Text style={{ fontSize: 14, color: '#666', marginHorizontal: 10 }}>{userInfo.followingCount} following</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
          <TouchableOpacity onPress={openEditProfile} style={{ backgroundColor: '#f0f0f0', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 }}>
            <Text style={{ fontSize: 14, color: '#111' }}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#f0f0f0', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 }}>
            <Text style={{ fontSize: 14, color: '#111' }}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 10, marginTop: 20 }}>
        <TouchableOpacity onPress={() => setSelectedTab('posts')}><Text style={{ fontWeight: selectedTab === 'posts' ? 'bold' : 'normal' }}>POSTS</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('saved')}><Text style={{ fontWeight: selectedTab === 'saved' ? 'bold' : 'normal' }}>SAVED</Text></TouchableOpacity>
      </View>

      {selectedTab === 'posts' ? (
        posts.length > 0 ? (
          <FlatList
            data={posts}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderPost}
            numColumns={3}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>No posts yet</Text>
        )
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>Saved posts coming soon...</Text>
      )}

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, width: '85%', padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Edit Profile</Text>
            <TouchableOpacity onPress={pickImage} disabled={uploading} style={{ alignItems: 'center', marginBottom: 10 }}>
              {editProfileImage ? (
                <Image source={{ uri: editProfileImage }} style={{ width: 80, height: 80, borderRadius: 40 }} />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ccc' }} />
              )}
              {uploading && <ActivityIndicator style={{ marginTop: 5 }} />}
              <Text style={{ color: '#007AFF', marginTop: 6 }}>Change Photo</Text>
            </TouchableOpacity>
            <TextInput value={editName} onChangeText={setEditName} placeholder="Name" style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, marginBottom: 10 }} />
            <TextInput value={editPronouns} onChangeText={setEditPronouns} placeholder="Pronouns (e.g. she/her)" style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10 }} />
            <TouchableOpacity onPress={handleSaveProfile} disabled={loading} style={{ backgroundColor: '#007AFF', padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center' }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEditProfile(false)} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: '#007AFF' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;