import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { postService } from '../services/postService';
import { globalStyles } from '../styles/globalStyles';

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
  Caption: {
    imageUri: string;
  };
};

type CaptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Caption'>;
type CaptionScreenRouteProp = RouteProp<RootStackParamList, 'Caption'>;

type CaptionScreenProps = {
  navigation: CaptionScreenNavigationProp;
  route: CaptionScreenRouteProp;
};

// ... imports unchanged
export default function CaptionScreen({ navigation, route }: CaptionScreenProps) {
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { imageUri } = route.params;

  const handleShare = async () => {
    if (isPosting) return;

    try {
      setIsPosting(true);

      if (!caption.trim()) {
        Alert.alert('Error', 'Please add a caption to your post');
        return;
      }

      await postService.createPost(
        imageUri,
        caption,
        hashtags.trim().split(' ').filter(tag => tag.startsWith('#'))
      );

      Alert.alert('Success', 'Your post has been shared!', [
        { text: 'OK', onPress: () => navigation.navigate('Main') },
      ]);
    } catch (error) {
      console.error('Error sharing post:', error);
      let errorMessage = 'Failed to share your post. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('logged in')) {
          errorMessage = 'Please log in to share posts.';
        } else if (error.message.includes('profile not found')) {
          errorMessage = 'Your profile was not found. Please try logging in again.';
        } else if (error.message.includes('permission-denied')) {
          errorMessage = 'You do not have permission to share posts.';
        }
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <View style={[globalStyles.container, styles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New post</Text>
        <TouchableOpacity onPress={handleShare} disabled={isPosting}>
          <Text style={[styles.shareButton, isPosting && styles.shareButtonDisabled]}>
            {isPosting ? 'Sharing...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        </View>

        {/* Caption Input */}
        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption..."
          multiline
          value={caption}
          onChangeText={setCaption}
          editable={!isPosting}
        />

        {/* Options */}
        <TouchableOpacity style={styles.optionRow}>
          <Ionicons name="person-add-outline" size={20} color="#666" />
          <Text style={styles.optionText}>Tag people</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <Text style={styles.optionText}>Add location</Text>
        </TouchableOpacity>

        <View style={styles.hashtagContainer}>
          <TextInput
            style={styles.hashtagInput}
            placeholder="Add hashtags (separate with spaces)"
            value={hashtags}
            onChangeText={setHashtags}
            autoCapitalize="none"
            editable={!isPosting}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    backgroundColor: '#FFE683',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  shareButton: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  captionInput: {
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  optionText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
  },
  hashtagContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  hashtagInput: {
    fontSize: 16,
    color: '#000',
  },
});
