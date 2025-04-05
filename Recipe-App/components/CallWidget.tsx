import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { onValue, ref, push, remove } from 'firebase/database';
import { database } from '../firebaseConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { BACKEND_URL } from '../constant';


interface EmailLoggerProps {
  email?: string;
  profileUrl?: string;
}

interface CallLog {
    email: string;
    timestamp: number;
    roomCode: string;
}


const EmailLogger: React.FC<EmailLoggerProps> = ({
  email = 'jz@mail.com',
  profileUrl = 'https://i.pravatar.cc/300',
}) => {
  const [isCalling, setIsCalling] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const callIdRef = useRef<string | null>(null);
  const ringtoneRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasEndedRef = useRef(false);

  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const startCall = async () => {
    if (isCalling) return;
    hasEndedRef.current = false;

    try {
      const logRef = ref(database, 'email_logs');
      const newRef = await push(logRef, {
        email,
        timestamp: Date.now(),
        roomCode: callIdRef.current, // 🆕 store room code
      });

      setCallId(newRef.key);
      callIdRef.current = newRef.key;
      setIsCalling(true);

      // Load ringtone
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/ringtone.mp3'),
        { isLooping: true }
      );
      ringtoneRef.current = sound;
      await sound.playAsync();

      // After modal opens, hit Daily API
      setLoadingVideo(true);
      const res = await fetch(`${BACKEND_URL}/api/video-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.url) setVideoUrl(data.url);
      else console.warn('No video URL returned');
      setLoadingVideo(false);

      timerRef.current = setTimeout(() => {
        endCall();
      }, 20000);
    } catch (err) {
      console.error('Error starting call:', err);
      setLoadingVideo(false);
    }
  };

  const endCall = async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
  
    setIsCalling(false);
  
    try {
      // Stop and unload ringtone
      if (ringtoneRef.current) {
        await ringtoneRef.current.stopAsync();
        await ringtoneRef.current.unloadAsync();
        ringtoneRef.current = null;
      }
  
      // Remove call log + delete video room from backend
      if (callIdRef.current) {
        // Remove from Firebase
        const callRef = ref(database, `email_logs/${callIdRef.current}`);
        await remove(callRef);
  
        // 🔥 Send DELETE request to Flask to delete the Daily room
        try {
          await fetch(`${BACKEND_URL}/api/video-room/${callIdRef.current}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.warn('Failed to delete video room from backend:', err);
        }
  
        callIdRef.current = null;
        setCallId(null);
      }
  
      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
  
      // Reset call state
      setMuted(false);
      setDeafened(false);
      setCameraOff(false);
      setVideoUrl(null);
    } catch (err) {
      console.error('Error ending call:', err);
    }
  };

  useEffect(() => {
    const userEmail = email; // use from props
    const logsRef = ref(database, 'email_logs');
  
    const unsubscribe = onValue(logsRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
  
      const entries = Object.entries(data);
  
      for (const [id, log] of entries as [string, CallLog][]) {
        if (log.email === userEmail && !isCalling) {
          callIdRef.current = id;
          setCallId(id);
          setIsCalling(true);
          hasEndedRef.current = false;
  
          try {
            // Play ringtone
            const { sound } = await Audio.Sound.createAsync(
              require('../assets/ringtone.mp3'),
              { isLooping: true }
            );
            ringtoneRef.current = sound;
            await sound.playAsync();
  
            // Fetch room using roomCode
            setLoadingVideo(true);
            const res = await fetch(`${BACKEND_URL}/api/video-room/${log.roomCode}`);
            const result = await res.json();
  
            if (result.url) setVideoUrl(result.url);
            else console.warn('No video URL returned');
  
            setLoadingVideo(false);
  
            timerRef.current = setTimeout(() => {
              endCall();
            }, 20000);
          } catch (err) {
            console.error('Error connecting to call:', err);
          }
  
          break; // stop after first match
        }
      }
    });
  
    return () => unsubscribe();
  }, []);
  
  

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={startCall}
        style={[styles.callButton, isCalling && { opacity: 0.6 }]}
        disabled={isCalling}
      >
        <Ionicons name="call" size={36} color="white" />
      </TouchableOpacity>

      <Modal visible={isCalling} transparent animationType="fade">
        <View style={styles.overlay}>
          <Image source={{ uri: profileUrl }} style={styles.avatar} />
          <Text style={styles.callingText}>Calling {email}...</Text>

          {loadingVideo ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : videoUrl ? (
            <WebView
              source={{ uri: videoUrl }}
              style={{ height: 300, width: '90%', marginVertical: 20 }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
            />
          ) : (
            <Text style={{ color: '#ccc' }}>Waiting for video...</Text>
          )}

          <View style={styles.controls}>
            <TouchableOpacity onPress={() => setMuted(!muted)}>
              <Ionicons
                name={muted ? 'mic-off' : 'mic'}
                size={32}
                color={muted ? '#999' : 'white'}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={endCall}>
              <Ionicons name="close-circle" size={48} color="#FF3B30" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setDeafened(!deafened)}>
              <Ionicons
                name={deafened ? 'volume-mute' : 'volume-high'}
                size={32}
                color={deafened ? '#999' : 'white'}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCameraOff(!cameraOff)}>
              <Ionicons
                name={cameraOff ? 'videocam-off' : 'videocam'}
                size={32}
                color={cameraOff ? '#999' : 'white'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  callButton: {
    backgroundColor: '#ff4d4d',
    borderColor: '#ff1a1a',
    borderWidth: 2,
    borderRadius: 100,
    padding: 18,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff1a1a',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000000dd',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'white',
  },
  callingText: {
    fontSize: 20,
    color: 'white',
    marginBottom: 20,
  },
  controls: {
    flexDirection: 'row',
    gap: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EmailLogger;
