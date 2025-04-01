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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, firestore } from '../firebaseConfig';
import { collection, getDocs, query, where, DocumentData, doc, getDoc, setDoc } from 'firebase/firestore';

interface UserInfo {
  name: string;
  age?: string;
  pronouns?: string;
  profileImage?: string; // Should be a public URL from Firebase Storage (getDownloadURL)
}

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
  Caption: { imageUri: string };
  EditProfile: undefined;
};

const screenWidth = Dimensions.get('window').width;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', pronouns: '' });
  const [posts, setPosts] = useState<DocumentData[]>([]);
  const [selectedTab, setSelectedTab] = useState<'posts' | 'saved'>('posts');

  const fetchUserInfo = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserInfo(userDoc.data() as UserInfo);
        } else {
          // If user document doesn't exist, create it with default values
          await setDoc(userDocRef, {
            name: currentUser.displayName || 'Anonymous',
            profileImage: undefined,
            pronouns: '',
            createdAt: new Date(),
          });
          setUserInfo({
            name: currentUser.displayName || 'Anonymous',
            profileImage: undefined,
            pronouns: '',
          });
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        Alert.alert('Error', 'Failed to load user information');
      }
    }
  };

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
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}>
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
});

