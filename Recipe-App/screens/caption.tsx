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

export default function CaptionScreen({ navigation, route }: CaptionScreenProps) {
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { imageUri } = route.params;

  const handleShare = async () => {
    if (isPosting) return;

    try {
      setIsPosting(true);

      // Validate inputs
      if (!caption.trim()) {
        Alert.alert('Error', 'Please add a caption to your post');
        return;
      }

      // Create post using the service
      await postService.createPost(
        imageUri,
        caption,
        hashtags.trim().split(' ').filter(tag => tag.startsWith('#'))
      );

      Alert.alert(
        'Success',
        'Your post has been shared!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch (error) {
      console.error('Error sharing post:', error);
      let errorMessage = 'Failed to share your post. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('logged in')) {
          errorMessage = 'Please log in to share posts.';
        } else if (error.message.includes('profile not found')) {
          errorMessage = 'Your profile was not found. Please try logging in again.';
        } else if (error.message.includes('permission-denied')) {
          errorMessage = 'You do not have permission to share posts. Please check your account status.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity 
          onPress={handleShare}
          disabled={isPosting}
        >
          <Text style={[
            styles.shareButton,
            isPosting && styles.shareButtonDisabled
          ]}>
            {isPosting ? 'Sharing...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Preview */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Caption Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            multiline
            value={caption}
            onChangeText={setCaption}
            autoFocus={false}
            editable={!isPosting}
          />
        </View>

        {/* Hashtags Input */}
        <View style={styles.inputContainer}>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEEB7',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
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
    paddingTop: 10,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 15,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  inputContainer: {
    padding: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  captionInput: {
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: 'top',
    padding: 0,
  },
  hashtagInput: {
    fontSize: 16,
    padding: 0,
  },
}); 