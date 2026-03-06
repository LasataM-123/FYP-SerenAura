import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore'; 
import { getTodayMood } from '@/lib/api/mood';
import { API_URL } from '@/config'; 
import { getProfile } from '@/lib/api/auth';

interface MusicContextType {
  isMusicEnabled: boolean;
  toggleMusic: () => Promise<void>;
  mood: string;
  updateMusicMood: (mood: string) => Promise<void>;
  setIsOtherMediaPlaying: (playing: boolean) => void;
  playMusic: () => void;
  pauseMusic: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

const MOOD_TRACKS: Record<string, any> = {
  Happy: require('../assets/music/happy.mp3'),
  Good: require('../assets/music/good.mp3'),
  Okay: require('../assets/music/okay.mp3'),
  Sad: require('../assets/music/sad.mp3'),
  Anxious: require('../assets/music/anxious.mp3'),
  Angry: require('../assets/music/angry.mp3'),
};

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, role, userId } = useAuthStore();
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [isOtherMediaPlaying, setIsOtherMediaPlaying] = useState(false);
  
  // Default state is 'Okay', but we need to enforce it dynamically
  const [mood, setMoodState] = useState('Okay');
  
  const [isForcedPaused, setIsForcedPaused] = useState(false);
  const [hasFetchedMood, setHasFetchedMood] = useState(false); 
  
  const soundRef = useRef<Audio.Sound | null>(null);

  // --- 1. Fetch Mood on Login ---
  const fetchInitialMood = async () => {
    if (!isLoggedIn || role !== 'patient') return;
    
    setHasFetchedMood(false); 
    
    try {
      const res = await getTodayMood();
      if (res.success && res.data?.mood) {
        setMoodState(res.data.mood);
      } else {
        setMoodState('Okay');
      }
    } catch (error) {
      console.error("MusicContext: Failed to fetch today's mood", error);
      setMoodState('Okay');
    } finally {
      setHasFetchedMood(true); 
    }
  };

  useEffect(() => {
    if (isLoggedIn && role === 'patient') {
      fetchInitialMood();
      loadSettings();
    } else {
      setMoodState('Okay');
      setHasFetchedMood(false); 
      stopAndUnload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, role]);

  // --- 2. Load Settings (Local First, then DB Sync) ---
  const loadSettings = async () => {
    // FIRST: Instantly load local settings so the user isn't kept waiting
    const saved = await AsyncStorage.getItem('musicEnabled');
    if (saved !== null) {
      setIsMusicEnabled(JSON.parse(saved));
    } else {
      setIsMusicEnabled(true); // Default if brand new install
    }

    // THEN: Silently check the database in the background to ensure we are synced
    if (isLoggedIn && role === 'patient') {
      try {
        const res = await getProfile();
        
        // Safely check both just in case your backend uses `musicEnabled` instead of `isMusicEnabled`
        const dbMusicSetting = res.profile?.isMusicEnabled ?? res.profile?.isMusicEnabled;
        
        if (res.success && typeof dbMusicSetting === 'boolean') {
          // Only update state and storage if the database has a different value
          if (dbMusicSetting !== JSON.parse(saved || 'true')) {
            setIsMusicEnabled(dbMusicSetting);
            await AsyncStorage.setItem('musicEnabled', JSON.stringify(dbMusicSetting));
          }
        }
      } catch (error: any) {
        // Safe to ignore: means the auth token wasn't fully ready on app boot, 
        // but local settings already loaded perfectly!
        console.log("Music DB Sync deferred: Auth token not ready yet.");
      }
    }
  };

  const stopAndUnload = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) { /* ignore */ }
      soundRef.current = null;
    }
  };

  // --- 3. Audio Engine ---
  useEffect(() => {
    if (!isLoggedIn || role !== 'patient' || !hasFetchedMood) return;

    let isMounted = true;

    const loadSound = async () => {
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (e) { console.log("Unload error", e); }
        soundRef.current = null;
      }

      try {
        const trackSource = MOOD_TRACKS[mood] || MOOD_TRACKS['Okay'];
        
        const { sound } = await Audio.Sound.createAsync(
          trackSource,
          { 
            shouldPlay: isMusicEnabled && !isOtherMediaPlaying && !isForcedPaused, 
            isLooping: true, 
            volume: 1.0 
          }
        );

        if (isMounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (e) {
        console.error("MusicContext: Audio Load Error", e);
      }
    };

    loadSound();

    return () => { isMounted = false; };
  }, [mood, isLoggedIn, role, hasFetchedMood]); 

  // --- 4. Play/Pause Sync ---
  useEffect(() => {
    const syncPlayback = async () => {
      if (!soundRef.current || !hasFetchedMood) return;
      try {
        if (isMusicEnabled && !isOtherMediaPlaying && isLoggedIn && role === 'patient' && !isForcedPaused) {
          await soundRef.current.playAsync();
        } else {
          await soundRef.current.pauseAsync();
        }
      } catch (e) { /* ignore */ }
    };
    syncPlayback();
  }, [isMusicEnabled, isOtherMediaPlaying, isLoggedIn, role, hasFetchedMood, isForcedPaused]);

  // --- 5. Context Actions ---
  const updateMusicMood = async (newMood: string) => {
    if (newMood === mood) return;
    setMoodState(newMood);
    await AsyncStorage.setItem('currentMood', newMood);
  };

  const toggleMusic = async () => {
    const newState = !isMusicEnabled;
    
    // 1. Update local UI and storage instantly
    setIsMusicEnabled(newState);
    await AsyncStorage.setItem('musicEnabled', JSON.stringify(newState));

    // 2. Sync to Backend ONLY if the user is a patient
    if (isLoggedIn && userId && role === 'patient') {
      try {
        const response = await fetch(`${API_URL}/music/music-preference`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            musicEnabled: newState
          })
        });

        if (!response.ok) {
           const errorData = await response.json().catch(() => ({}));
           console.error("Backend rejected the music update:", errorData);
        } else {
           console.log(`Music preference successfully synced to DB! (Enabled: ${newState})`);
        }

      } catch (error) {
        console.error("Network error syncing music preference:", error);
      }
    }
  };

  const playMusic = () => setIsForcedPaused(false);
  const pauseMusic = () => setIsForcedPaused(true);

  return (
    <MusicContext.Provider value={{ 
      isMusicEnabled, 
      toggleMusic, 
      mood, 
      updateMusicMood, 
      setIsOtherMediaPlaying,
      playMusic,
      pauseMusic
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};