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
  TouchableOpacity,
  ScrollView,
  Alert,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Minus } from 'lucide-react-native';

import Top from '@/components/top';
import Button from '@/components/Button';
import Overlay from '@/components/Overlay';
import { images } from '@/constants';
import { useBackend } from '@/lib/useBackend';
import { createSupportQuestion, getTopQuestions } from '@/lib/api/faq';

const COLORS = {
  border: '#553434',
  text: '#553434',
  bg: '#fff',
  inputBg: '#F5EFFF',
  accordionBg: '#E6F2EA',
};

const FONTS = {
  bold: 'KodchasanSemiBold',
  medium: 'KodchasanMedium',
  regular: 'KodchasanRegular',
};

const AccordionItem = ({ question, answer }: { question: string; answer: string }) => {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, friction: 4, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(expandAnim, {
      toValue,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const heightInterpolate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  const opacityInterpolate = expandAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.6, 1],
  });

  return (
    <TouchableWithoutFeedback
      onPress={toggleExpand}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[styles.faqWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.shadowLayer} />
        <View style={styles.accordionBox}>
          {/* Header */}
          <View style={styles.accordionHeader}>
            <Text style={styles.questionText}>{question}</Text>
            {expanded ? (
              <Minus size={20} color={COLORS.border} strokeWidth={3} />
            ) : (
              <Plus size={20} color={COLORS.border} strokeWidth={3} />
            )}
          </View>

          {/* Divider */}
          <Animated.View style={[styles.divider, { opacity: opacityInterpolate }]} />

          {/* Invisible content for measurement (FIXED) */}
          {!contentHeight && (
            <View
              style={{ position: 'absolute', opacity: 0 }}
              onLayout={e => setContentHeight(e.nativeEvent.layout.height)}
            >
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{answer}</Text>
              </View>
            </View>
          )}

          {/* Answer */}
          {contentHeight > 0 && (
            <Animated.View
              style={{
                height: heightInterpolate,
                opacity: opacityInterpolate,
                overflow: 'hidden',
              }}
            >
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{answer}</Text>
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

/* ---------------- MAIN SCREEN ---------------- */
const HelpSupport = () => {
  const [question, setQuestion] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);

  const { refetch: submitQuestion, loading: submitting } = useBackend({
    fn: createSupportQuestion,
  });

  const {
    data,
    refetch: fetchQuestions,
    loading: loadingFaqs,
  } = useBackend({
    fn: getTopQuestions,
  });

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#fff');
    }
    fetchQuestions();
  }, []);

  const createQuestion = async () => {
    if (!question.trim()) return;

    try {
      const res = await submitQuestion({ question });
      setQuestion('');
      if (res?.success) setShowOverlay(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };

  const isValid = question.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Top label="Help & Support" onBack={() => router.back()} />

        <Text style={styles.sectionTitle}>Got a Question?</Text>

        <View style={styles.inputWrapper}>
          <View style={styles.shadowLayer} />
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your question here..."
              placeholderTextColor="#553434"
              multiline
              value={question}
              onChangeText={setQuestion}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          disabled={!isValid}
          activeOpacity={0.8}
          onPress={isValid ? createQuestion : undefined}
          style={{ opacity: isValid ? 1 : 0.4, width: '100%' }}
        >
          <Button
            label={submitting ? 'Sending...' : 'Send Question'}
            variant="solid"
            onPress={createQuestion}
          />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {loadingFaqs ? (
          <Text style={styles.infoText}>Loading FAQs...</Text>
        ) : data?.data?.length ? (
          <View style={styles.faqList}>
            {data.data.map(item => (
              <AccordionItem
                key={item._id}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.infoText}>No FAQs available yet.</Text>
        )}
      </ScrollView>

      {showOverlay && (
        <Overlay
          title="Support Question sent successfully!"
          description="Your support question has been sent successfully."
          imageSource={images.tick}
          label="Continue"
          onPress={() => {
            setShowOverlay(false);
            fetchQuestions();
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default HelpSupport;

/* ---------------- STYLES ---------------- */
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
  infoText: {
    fontFamily: FONTS.medium,
    color: COLORS.text,
    fontSize: 14,
  },
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
    gap: 20,
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
  },
  accordionBox: {
    backgroundColor: COLORS.accordionBg,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.accordionBg,
  },
  divider: {
    height: 3,
    backgroundColor: COLORS.border,
    width: '100%',
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
