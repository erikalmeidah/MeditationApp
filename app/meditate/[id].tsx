import AppGradient from '@/components/AppGradient';
import CustomButton from '@/components/CustomButton';
import { AUDIO_FILES, MEDITATION_DATA } from '@/constants/meditation-data';
import MEDITATION_IMAGES from "@/constants/meditation-images";
import { TimerContext } from '@/context/timerContext';
import { AntDesign } from '@expo/vector-icons';
import { Audio } from "expo-av";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';

const Meditate = () => {
    const { id } = useLocalSearchParams();
    const { duration: secondsRemaining, setDuration } = useContext(TimerContext);
    const [isMeditating, setMeditating] = useState(false);
    const [audioSound, setSound] = useState<Audio.Sound>();
    const [isPlaying, setPlayingAudio] = useState(false);

    // Setup audio permissions and settings when component mounts
    useEffect(() => {
        const setupAudio = async () => {
            try {
                console.log("Setting up audio...");
                const permissionResponse = await Audio.requestPermissionsAsync();
                console.log("Audio permission status:", permissionResponse.status);
                
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });
                console.log("Audio mode set successfully");
            } catch (error) {
                console.error("Error setting up audio:", error);
            }
        };
        
        setupAudio();
    }, []);

    // Timer effect
    useEffect(() => {
        let timerId: NodeJS.Timeout;

        if (secondsRemaining === 0) {
            if (isPlaying) {
                console.log("Timer reached 0, pausing audio");
                audioSound?.pauseAsync();
            }
            setMeditating(false);
            setPlayingAudio(false);
            return;
        }

        if (isMeditating) {
            timerId = setTimeout(() => {
                setDuration(secondsRemaining - 1);
            }, 1000);
        }
        
        return () => {
            clearTimeout(timerId);
        };
    }, [secondsRemaining, isMeditating, isPlaying, audioSound]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            console.log("Component unmounting, cleaning up audio");
            setDuration(10);
            if (audioSound) {
                audioSound.unloadAsync();
            }
        };
    }, [audioSound]);

    const formattedTimeMinutes = String(Math.floor(secondsRemaining/60)).padStart(2, "0");
    const formattedTimeSeconds = String(secondsRemaining % 60).padStart(2, "0");    
    
    const toggleMeditationSessionStatus = async () => {
        try {
            console.log("Toggling meditation session status");
            if (secondsRemaining === 0) setDuration(10);

            setMeditating(!isMeditating);
            await toggleSound();
        } catch (error) {
            console.error("Error toggling meditation status:", error);
        }
    };

    const toggleSound = async () => {
        try {
            console.log("Toggling sound");
            const sound = audioSound ? audioSound : await initializeSound();
            if (!sound) {
                console.error("Sound object is null or undefined");
                return;
            }

            const status = await sound.getStatusAsync();
            console.log("Sound status:", JSON.stringify(status));

            if (status.isLoaded) {
                if (!isPlaying) {
                    console.log("Playing sound");
                    await sound.playAsync();
                    setPlayingAudio(true);
                } else {
                    console.log("Pausing sound");
                    await sound.pauseAsync();
                    setPlayingAudio(false);
                }
            } else {
                console.error("Sound isn't loaded yet");
            }
        } catch (error) {
            console.error("Error toggling sound:", error);
        }
    };

    const initializeSound = async () => {
        try {
            console.log("Initializing sound for meditation ID:", id);
            const meditationIndex = Number(id) - 1;
            
            if (isNaN(meditationIndex) || meditationIndex < 0 || meditationIndex >= MEDITATION_DATA.length) {
                console.error("Invalid meditation ID:", id);
                return null;
            }
            
            const audioFileName = MEDITATION_DATA[meditationIndex].audio;
            console.log("Audio file name:", audioFileName);
            
            if (!AUDIO_FILES[audioFileName]) {
                console.error("Audio file not found in AUDIO_FILES:", audioFileName);
                return null;
            }
            
            console.log("Creating sound from:", AUDIO_FILES[audioFileName]);
            const { sound } = await Audio.Sound.createAsync(
                AUDIO_FILES[audioFileName],
                { shouldPlay: false, volume: 1.0 }
            );
            
            console.log("Sound created successfully");
            setSound(sound);
            return sound;
        } catch (error) {
            console.error("Error initializing sound:", error);
            return null;
        }
    };

    const handleAdjustDuration = () => {
        if (isMeditating) toggleMeditationSessionStatus();
        router.push('/(modal)/adjust-meditation-duration');
    };

    return (
        <View className='flex-1'>
            <ImageBackground
                source={MEDITATION_IMAGES[Number(id) - 1]}
                resizeMode='cover'
                className='flex-1'
            >
                <AppGradient colors={["transparent", "rgba(0, 0, 0, 0.8)"]}>
                    <Pressable
                        onPress={() => router.back()}
                        className='absolute top-16 left-6 z-10'
                    >
                        <AntDesign name='leftcircleo' size={50} color="white" />
                    </Pressable>

                    <View className='flex-1 justify-center'>
                        <View className=' mx-auto bg-neutral-200 rounded-full w-44 h-44 justify-center items-center'>
                            <Text className='text-4xl text-blue-800 font-rmono'>
                                {formattedTimeMinutes}:{formattedTimeSeconds}
                            </Text>
                        </View>
                    </View>

                    <View className='mb-5'>
                        <CustomButton title='Adjust Duration' onPress={() => handleAdjustDuration()}/>
                        <CustomButton title={isMeditating ? "Stop" : "Start Meditation"} onPress={() => toggleMeditationSessionStatus()} containerStyles='mt-4'/>
                    </View>
                </AppGradient>
            </ImageBackground>
        </View>
    );
};

export default Meditate;