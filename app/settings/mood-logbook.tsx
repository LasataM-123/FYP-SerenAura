import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  PieChart, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  PartyPopper 
} from 'lucide-react-native';
import Top from '@/components/top';

// --- Constants ---
const { width } = Dimensions.get('window');
const PADDING_HORIZONTAL = 24;
const GAP = 10;
// Calculate precise width for 3 columns: (Screen - Padding - Gaps) / 3
const TAG_ITEM_WIDTH = (width - (PADDING_HORIZONTAL * 2) - (GAP * 2)) / 3;

const COLORS = {
  border: '#553434',
  text: '#553434',
  textLight: '#BCAAA4', 
  bg: '#fff',
  
  cardYellow: '#FFF3B0',
  cardPurple: '#E1BEE7',
  cardGreen: '#96D1BD',
  cardRed: '#E87964',
  
  // Chart Colors
  chartYellow: '#FFE082', 
  chartBlue: '#81D4FA',   
  chartGreen: '#A5D6A7',  
  chartRed: '#EF9A9A',    
  chartPurple: '#CE93D8', 
};

const FONTS = {
  bold: "KodchasanSemiBold",
  medium: "KodchasanMedium",
  regular: "KodchasanRegular",
  light: "KodchasanLight",
};

// Reusable Hard Shadow Style (3px 3px 0px)
const hardShadow = {
  borderWidth: 3,
  borderColor: COLORS.border,
  shadowColor: COLORS.border,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4, 
};

const MoodLogBook = () => {
  // --- Calendar State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 1);

  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("#fff");
    }
  }, []);

  // --- Calendar Handlers ---
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    if (newDate >= minDate) setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (newDate <= today) setCurrentDate(newDate);
  };

  const isNextDisabled = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  const isPrevDisabled = currentDate.getMonth() === minDate.getMonth() && currentDate.getFullYear() === minDate.getFullYear();

  // --- Grid Generation ---
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Adjust start to Monday (Mon=0, Sun=6)
    const startDayIndex = firstDay === 0 ? 6 : firstDay - 1; 

    const grid = [];
    
    // 1. Prev Month Days (Grey)
    for (let i = startDayIndex - 1; i >= 0; i--) {
      grid.push({ day: daysInPrevMonth - i, isCurrent: false, key: `prev-${i}` });
    }
    
    // 2. Current Month Days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({ day: i, isCurrent: true, key: `curr-${i}` });
    }
    
    // 3. Next Month (Only fill the remaining slots in the LAST row)
    const totalCellsSoFar = grid.length;
    const remainder = totalCellsSoFar % 7;
    
    if (remainder !== 0) {
      const daysNeeded = 7 - remainder;
      for (let i = 1; i <= daysNeeded; i++) {
        grid.push({ day: i, isCurrent: false, key: `next-${i}` });
      }
    }
    
    return grid;
  };

  const calendarData = generateCalendarGrid();
  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: PADDING_HORIZONTAL, paddingBottom: 40 }}
      >
        <Top label='Mood Logbook' onBack={() => router.back()}/>

        {/* --- SECTION 1: TODAY'S MOOD --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.headerRow}>
            <MapPin size={18} color={COLORS.text} />
            <Text style={styles.headerText}>Today's Mood</Text>
          </View>

          <View style={[styles.card, { backgroundColor: COLORS.cardYellow }]}>
             <View style={styles.moodHeader}>
                <View style={styles.moodIconCircle}>
                  <Text style={{ fontSize: 24 }}>😃</Text>
                </View>
                <View>
                  <Text style={styles.cardTitle}>Happy</Text>
                  <Text style={styles.subText}>Logged at 10:30 a.m.</Text>
                </View>
             </View>

             <Text style={styles.label}>Journal:</Text>
             <TextInput 
               style={styles.readOnlyInput} 
               value="Hello" 
               editable={false} 
             />
          </View>
        </View>

        {/* --- SECTION 2: MOOD CALENDAR --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.headerRow}>
            <CalendarIcon size={18} color={COLORS.text} />
            <Text style={styles.headerText}>Mood Calendar</Text>
          </View>

          <View style={[styles.card, { backgroundColor: COLORS.cardPurple }]}>
            {/* Nav */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} disabled={isPrevDisabled} style={{opacity: isPrevDisabled ? 0.3 : 1}}>
                <ChevronLeft size={24} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.dateBadge}>
                 <Text style={styles.calendarTitle}>{monthLabel}</Text>
              </View>
              <TouchableOpacity onPress={handleNextMonth} disabled={isNextDisabled} style={{opacity: isNextDisabled ? 0.3 : 1}}>
                <ChevronRight size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Grid */}
            <View style={styles.calendarGrid}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <Text key={i} style={styles.dayLabel}>{day}</Text>
              ))}
              
              {calendarData.map((item) => {
                let emoji = null;
                if (item.isCurrent) {
                   if (item.day === 1) emoji = "😝";
                   if (item.day === 2) emoji = "😑";
                   if (item.day === 3) emoji = "😍";
                   if (item.day === 30) emoji = "😴";
                }
                
                return (
                  <View key={item.key} style={styles.dayCell}>
                    <Text style={[styles.dateText, !item.isCurrent && styles.dateTextDisabled]}>
                      {item.day}
                    </Text>
                    <View style={styles.moodDotContainer}>
                      {emoji ? (
                        <Text style={{fontSize: 12}}>{emoji}</Text>
                      ) : (
                        <View style={[styles.emptyDot, !item.isCurrent && styles.emptyDotDisabled]} />
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        {/* --- SECTION 3: PIE CHART --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.headerRow}>
            <PartyPopper size={18} color={COLORS.text} />
            <Text style={styles.headerText}>Your #1 mood</Text>
          </View>

          <View style={styles.chartWrapper}>
            <View style={styles.donutContainer}>
              {/* Slices */}
              <View style={[styles.donutSlice, { backgroundColor: COLORS.chartYellow, transform: [{rotate: '0deg'}] }]} /> 
              <View style={[styles.donutSlice, { backgroundColor: COLORS.chartBlue, transform: [{rotate: '140deg'}] }]} />
              <View style={[styles.donutSlice, { backgroundColor: COLORS.chartGreen, transform: [{rotate: '250deg'}] }]} />
              <View style={[styles.donutSlice, { backgroundColor: COLORS.chartRed, transform: [{rotate: '290deg'}] }]} />
              <View style={[styles.donutSlice, { backgroundColor: COLORS.chartPurple, transform: [{rotate: '330deg'}] }]} />
              
              {/* Dividers */}
              <View style={[styles.chartDivider, { transform: [{rotate: '140deg'}] }]} />
              <View style={[styles.chartDivider, { transform: [{rotate: '250deg'}] }]} />
              <View style={[styles.chartDivider, { transform: [{rotate: '290deg'}] }]} />
              <View style={[styles.chartDivider, { transform: [{rotate: '330deg'}] }]} />
              <View style={[styles.chartDivider, { transform: [{rotate: '0deg'}] }]} />

              <View style={styles.donutHole}>
                 <Text style={{fontSize: 24}}>😃</Text>
                 <Text style={styles.smallText}>Happy</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.summaryText}>
            Your most logged mood is Happy with 6 entries this month.
          </Text>
        </View>

        {/* --- SECTION 4: DISTRIBUTION --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.headerRow}>
            <PieChart size={18} color={COLORS.text} />
            <Text style={styles.headerText}>Mood Distribution</Text>
          </View>
          
          <View style={{ gap: 12 }}>
            <DistributionItem label="Happy" pct="30%" color={COLORS.chartYellow} icon="😃" />
            <DistributionItem label="Good" pct="30%" color={COLORS.chartBlue} icon="😄" />
            <DistributionItem label="Okay" pct="20%" color={COLORS.chartGreen} icon="😐" />
            <DistributionItem label="Angry" pct="10%" color={COLORS.chartRed} icon="😡" />
            <DistributionItem label="Sad" pct="10%" color={COLORS.chartPurple} icon="👿" />
          </View>
        </View>

        {/* --- SECTION 5: TAGS (3 per line) --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.headerRow}>
            <Tag size={18} color={COLORS.text} />
            <Text style={styles.headerText}>Most Logged tags</Text>
          </View>
          
          <View style={styles.tagsGrid}>
            <TagItem label="Grateful" />
            <TagItem label="Energetic" />
            <TagItem label="Calm" />
            <TagItem label="Stressed" />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// --- SUB-COMPONENTS ---

const DistributionItem = ({ label, pct, color, icon }: any) => (
  <View style={[styles.distContent, hardShadow]}>
     <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Text>{icon}</Text>
     </View>
     <View style={{flex: 1, marginLeft: 10}}>
        <Text style={styles.distLabel}>{label}</Text>
        <Text style={styles.distPct}>{pct}</Text>
     </View>
     <Text style={styles.distCount}>6 entries</Text>
  </View>
);

const TagItem = ({ label }: { label: string }) => (
  <View style={[styles.tagContent, hardShadow]}>
    <Tag size={14} color={COLORS.text} style={{marginRight:4}} />
    <Text style={styles.tagText} numberOfLines={1}>{label}</Text>
  </View>
);


export default MoodLogBook;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  sectionContainer: {
    marginTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  headerText: {
    fontSize: 18,
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    ...hardShadow
  },

  // --- TODAY'S MOOD ---
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  moodIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.border
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  subText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    opacity: 0.8,
  },
  label: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8
  },
  readOnlyInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: FONTS.medium,
    backgroundColor: '#fff', 
    color: COLORS.text,
    ...hardShadow,
    borderWidth: 2,
    elevation: 0 
  },

  // --- CALENDAR ---
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10
  },
  dateBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border
  },
  calendarTitle: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
    fontSize: 14
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // keeps days aligned to left (standard grid)
  },
  dayLabel: {
    width: '14.28%', 
    textAlign: 'center',
    fontFamily: FONTS.bold,
    marginBottom: 8,
    color: COLORS.text,
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  dateTextDisabled: {
    color: COLORS.textLight,
  },
  moodDotContainer: {
    height: 18, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
  },
  emptyDotDisabled: {
    borderColor: COLORS.textLight,
    opacity: 0.5,
  },

  // --- CHART ---
  chartWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  donutContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border, 
  },
  donutSlice: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: 0,
    left: 0,
  },
  chartDivider: {
    position: 'absolute',
    height: 160,
    width: 3,
    backgroundColor: COLORS.border,
    zIndex: 10,
  },
  donutHole: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  smallText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  summaryText: {
    textAlign: 'center',
    color: COLORS.text,
    fontFamily: FONTS.medium,
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // --- DISTRIBUTION ---
  distContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 10,
    height: 56,
    backgroundColor: '#ECF4F3',
    marginBottom: 2
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  distLabel: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
    fontSize: 14,
  },
  distPct: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  distCount: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  
  // --- TAGS GRID LAYOUT ---
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP, 
  },
  tagContent: {
    width: TAG_ITEM_WIDTH, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    backgroundColor: COLORS.cardYellow,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4, 
  },
  tagText: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
    fontSize: 13,
  }
});