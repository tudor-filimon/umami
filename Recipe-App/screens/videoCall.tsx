// VideoRoom.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text, Button } from 'react-native';
import { WebView } from 'react-native-webview';
import { BACKEND_URL } from '../constant/index';
import EmailLogger from '../components/CallWidget';
import { getAuth } from 'firebase/auth';


export default function VideoRoom() {
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuth(); 
  const user = auth.currentUser;
  const email = user?.email || 'jz@mail.com'; // fallback

  const createRoom = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/video-room`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url && data.name) {
        setRoomUrl(data.url);
        setRoomId(data.name);
      } else {
        setError('Could not get room URL.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch room.');
    }
  };

  const deleteRoom = async () => {
    if (!roomId) return;
    try {
      await fetch(`${BACKEND_URL}/api/delete-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId }),
      });
    } catch (err) {
      console.warn('Room deletion failed', err);
    }
  };

  /*
  useEffect(() => {
    createRoom();
    return () => {
      deleteRoom();
    };
  }, []);
  */
 
  const handleRetry = () => {
    setError(null);
    createRoom();
  };

  const handleLeaveRoom = async () => {
    await deleteRoom();
    setRoomUrl(null);
    setRoomId(null);
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
        <Button title="Retry" onPress={handleRetry} />
      </View>
    );
  }

  if (false) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Creating room...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Daily Video Room</Text>
        <Button title="Leave Room" color="#FF3B30" onPress={handleLeaveRoom} />
      </View>

        <View style={styles.boundary}>
            <Text>{email}</Text>
            <EmailLogger email={email}/>
        </View>

      <WebView
        source={{ uri: roomUrl || "" }}
        style={{ flex: 1 }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f2f2f2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  boundary: {
    borderWidth: 2,
    borderColor: 'red',
    borderRadius: 10,
    padding: 8,
    margin: 10,
  },
});
