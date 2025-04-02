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
import { auth, firestore, storage } from '../firebaseConfig';
import { collection, getDocs, query, where, DocumentData, doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadImage } from '../services/imageService';

interface UserInfo {
  name: string;
  age?: string;
  pronouns?: string;
  profileImage?: string; // Should be a public URL from Firebase Storage (getDownloadURL)
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
      const userRef = doc(firestore, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserInfo({
          name: userData.name || "",
          pronouns: userData.pronouns || "",
          profileImage: userData.profileImage || undefined,
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0
        });
      } else {
        // Create new user document with default values
        await setDoc(userRef, {
          name: currentUser.displayName || "New User",
          pronouns: "",
          profileImage: undefined,
          followersCount: 0,
          followingCount: 0,
          createdAt: new Date()
        });
        setUserInfo({
          name: currentUser.displayName || "New User",
          pronouns: "",
          profileImage: undefined,
          followersCount: 0,
          followingCount: 0
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      Alert.alert("Error", "Failed to load user information");
    }
  };

  // Set up real-time listener for user info
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userRef = doc(firestore, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setUserInfo({
          name: userData.name || "",
          pronouns: userData.pronouns || "",
          profileImage: userData.profileImage || undefined,
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0
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
      const userPosts = querySnapshot.docs
        .map(doc => doc.data())
        .filter(post => !!post.imageUrl);
      setPosts(userPosts);
    }
  };

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserInfo();
      fetchUserPosts();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await auth.signOut();
            Alert.alert('Logged Out', 'You have been logged out.', [
              { text: 'OK', onPress: () => navigation.navigate('Login') },
            ]);
          } catch (error) {
            Alert.alert('Error', 'Logout failed.');
          }
        },
      },
    ]);
  };

  const renderPost = ({ item }: { item: DocumentData }) => (
    <Image
      source={{ uri: item.imageUrl }}
      style={styles.postImage}
      resizeMode="cover"
    />
  );

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
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      setLoading(true);
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        name: editName,
        pronouns: editPronouns,
        profileImage: editProfileImage,
      });
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error saving profile:', error);
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

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        {userInfo.profileImage ? (
          <Image source={{ uri: userInfo.profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderCircle} />
        )}
        <View style={styles.textColumn}>
          <Text style={styles.nameText}>
            {userInfo.name || 'Loading...'}
            {userInfo.pronouns ? (
              <Text style={styles.pronounsText}> ({userInfo.pronouns})</Text>
            ) : null}
          </Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {userInfo.followersCount || 0} followers
            </Text>
            <Text style={styles.statsText}>
              {userInfo.followingCount || 0} following
            </Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={openEditProfile}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setSelectedTab('posts')}>
          <Text style={[styles.tabText, selectedTab === 'posts' && styles.activeTab]}>POSTS</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('saved')}>
          <Text style={[styles.tabText, selectedTab === 'saved' && styles.activeTab]}>SAVED</Text>
        </TouchableOpacity>
      </View>

      {/* Posts Grid */}
      {selectedTab === 'posts' ? (
        posts.length > 0 ? (
          <FlatList
            data={posts}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderPost}
            numColumns={3}
            contentContainerStyle={styles.postGrid}
          />
        ) : (
          <Text style={styles.placeholderText}>No posts yet</Text>
        )
      ) : (
        <Text style={styles.placeholderText}>Saved posts coming soon...</Text>
      )}

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditProfile}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowEditProfile(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <TouchableOpacity 
                onPress={pickImage} 
                style={styles.imageWrapper}
                disabled={uploading}
              >
                {editProfileImage ? (
                  <Image source={{ uri: editProfileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.placeholderCircle} />
                )}
                {uploading ? (
                  <ActivityIndicator size="small" color="#007AFF" style={styles.uploadIndicator} />
                ) : (
                  <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Name"
                value={editName}
                onChangeText={setEditName}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Pronouns (e.g. she/her, they/them)"
                value={editPronouns}
                onChangeText={setEditPronouns}
                editable={!loading}
              />

              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEEB7',
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  textColumn: {
    marginLeft: 15,
    flexShrink: 1,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
  },
  placeholderCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pronounsText: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  actionButton: {
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#aaa',
    paddingVertical: 10,
    backgroundColor: '#fff3d6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTab: {
    color: '#000',
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  postGrid: {
    paddingHorizontal: 2,
    paddingTop: 10,
  },
  postImage: {
    width: screenWidth / 3 - 4,
    height: screenWidth / 3,
    margin: 1,
    backgroundColor: '#eee',
  },
  placeholderText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFEEB7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  uploadIndicator: {
    marginTop: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

