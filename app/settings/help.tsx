import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableWithoutFeedback,
  ScrollView,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Minus } from 'lucide-react-native';
import Top from '@/components/top';

const COLORS = {
  border: '#553434',
  text: '#553434',
  bg: '#fff',
  inputBg: '#F5EFFF', 
  accordionBg: '#E6F2EA', 
};

const FONTS = {
  bold: "KodchasanSemiBold",
  medium: "KodchasanMedium",
  regular: "KodchasanRegular",
};

const FAQ_DATA = [
  {
    id: '1',
    question: 'How do I track my mood?',
    answer: 'Simply tap the "Log Mood" button on the dashboard, select your current feeling, add a journal entry if you wish, and save!',
  },
  {
    id: '2',
    question: 'Can I edit a past entry?',
    answer: 'Yes! Navigate to the Mood Calendar, tap on the specific day you want to change, and update your details.',
  },
  {
    id: '3',
    question: 'Are my journals private?',
    answer: 'Absolutely. Your data is encrypted and only accessible to you through your authenticated account.',
  },
  {
    id: '4',
    question: 'How do I export my data?',
    answer: 'Go to Settings > Data Management and select "Export as PDF" to get a summary of your monthly insights.',
  },
];

const AccordionItem = ({ question, answer }: { question: string, answer: string }) => {
  const [expanded, setExpanded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableWithoutFeedback 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={toggleExpand}
    >
      <Animated.View style={[styles.faqWrapper, { transform: [{ scale: scaleAnim }] }]}>
        {/* THE NEUBRUTALIST SHADOW LAYER */}
        <View style={styles.shadowLayer} />

        {/* THE MAIN CONTENT BOX */}
        <View style={[styles.accordionBox, expanded && styles.expandedBox]}>
          <View style={[styles.accordionHeader, expanded && styles.headerBorder]}>
            <Text style={styles.questionText}>{question}</Text>
            {expanded ? (
              <Minus size={20} color={COLORS.border} strokeWidth={3} />
            ) : (
              <Plus size={20} color={COLORS.border} strokeWidth={3} />
            )}
          </View>
          
          {expanded && (
            <View style={styles.answerContainer}>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const HelpSupport = () => {
  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("#fff");
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Top label='Help & Support' onBack={() => { router.back() }} />

        {/* --- QUESTION INPUT SECTION --- */}
        <Text style={styles.sectionTitle}>Got a Question?</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.shadowLayer} />
          <View style={styles.inputBox}>
             <TextInput
                style={styles.textInput}
                placeholder="Type your question here..."
                placeholderTextColor="#553434"
                multiline
                textAlignVertical="top"
              />
          </View>
        </View>

        {/* --- FAQ SECTION --- */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {FAQ_DATA.map((item) => (
            <AccordionItem 
              key={item.id} 
              question={item.question} 
              answer={item.answer} 
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupport;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 10,
  },
  
  // Input Section Fixes
  inputWrapper: {
    height: 150,
    position: 'relative',
    marginBottom: 20,
  },
  inputBox: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.border,
    padding: 12,
    zIndex: 1,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.text,
  },

  faqList: {
    gap: 20, // Increased gap so shadows don't touch
  },
  faqWrapper: {
    position: 'relative',
  },
  shadowLayer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: COLORS.border,
    borderRadius: 20,
    zIndex: 0,
  },
  accordionBox: {
    backgroundColor: COLORS.accordionBg,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.border,
    overflow: 'hidden',
    zIndex: 1,
  },
  expandedBox: {
    backgroundColor: COLORS.bg, 
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.accordionBg,
  },
  headerBorder: {
    borderBottomWidth: 3,
    borderColor: COLORS.border,
  },
  questionText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  answerContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  answerText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    lineHeight: 22,
  },
});