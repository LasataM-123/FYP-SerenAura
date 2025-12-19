import React, { useEffect, useState } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Minus } from 'lucide-react-native';
import Top from '@/components/top';

const COLORS = {
  border: '#553434',
  text: '#000',
  bg: '#fff',
  inputBg: '#fff',
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

  const toggleExpand = () => {
    // Smooth transition for expanding/shrinking
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity 
        style={[styles.accordionHeader, expanded && { borderBottomWidth: 3 }]} 
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text style={styles.questionText}>{question}</Text>
        {expanded ? (
          <Minus size={20} color={COLORS.border} strokeWidth={3} />
        ) : (
          <Plus size={20} color={COLORS.border} strokeWidth={3} />
        )}
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </View>
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
      <Top label='Help & Support' onBack={() => { router.back() }} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- QUESTION INPUT SECTION --- */}
        <Text style={styles.sectionTitle}>Got a Question?</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your question here..."
            placeholderTextColor="#A0A0A0"
            multiline
            textAlignVertical="top"
          />
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 16,
  },
  
  // Input Styles
  inputWrapper: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.border,
    height: 150,
    padding: 16,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.text,
  },

  // Accordion Styles
  faqList: {
    gap: 16,
  },
  accordionContainer: {
    backgroundColor: COLORS.accordionBg,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: COLORS.border,
    // The "Hard Shadow" effect
    shadowColor: COLORS.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderColor: COLORS.border,
  },
  questionText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.border,
    flex: 1,
    marginRight: 10,
  },
  answerContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  answerText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#666',
    lineHeight: 20,
  },
});