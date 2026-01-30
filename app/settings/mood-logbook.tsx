import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {

  Tag,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  PieChart as PieIcon,
  Info,
  CalendarDays,
  Pin,
} from 'lucide-react-native';
import Svg, { G, Circle, Path, Line } from 'react-native-svg';

import Top from '@/components/top';
import { useBackend } from '@/lib/useBackend';
import { getMoodCalendar, getMoodInsights, getTodayMood } from '@/lib/api/mood';
import { 
  MonthlyInsightsSuccessResponse, 
  CalendarMoodDay 
} from '@/lib/api/mood'; 
import { images } from '@/constants';
import Button from '@/components/Button';

const { width, height } = Dimensions.get('window');
const PADDING_HORIZONTAL = 24;
const GAP = 10;
const TAG_ITEM_WIDTH = (width - PADDING_HORIZONTAL * 2 - GAP * 2) / 3;

const MOOD_DEFS = [
  { name: "Happy", image: images.Happy, color: "#FFE37A" , lightColor:"#FFF3B0"},
  { name: "Good", image: images.Good, color: "#74CEE2", lightColor:"#B3ECF9" },
  { name: "Okay", image: images.Okay, color: "#96D1BD", lightColor:"#B5EAD7" },
  { name: "Sad", image: images.Sad, color: "#CB9DF0", lightColor:"#E1CFF7" },
  { name: "Anxious", image: images.Anxious, color: "#7395D0", lightColor:"#A8C2F0" },
  { name: "Angry", image: images.Angry, color: "#E87964", lightColor:"#F4B3A8" },
];

const feelings = [
  { id: "1", name: "Grateful", image: images.Grateful },
  { id: "2", name: "Energetic", image: images.Energetic },
  { id: "3", name: "Calm", image: images.Calm },
  { id: "4", name: "Stressed", image: images.Stressed },
  { id: "5", name: "Tired", image: images.Tired },
  { id: "6", name: "Excited", image: images.Excited },
];

const COLORS = {
  text: '#553434',
  cardMint: '#E6F2EA',
  emptyGrey: '#BCAAA4'
};

const MoodLogBook = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const now = new Date();

  const { data: calendarDataRes, loading: calendarLoading, refetch: refetchCalendar } = useBackend({ fn: getMoodCalendar });
  const { data: insightsRes, loading: insightLoading, refetch: refetchInsights } = useBackend({ fn: getMoodInsights });
  const { data: todayMoodRes, loading: todayLoading, refetch: refetchToday } = useBackend({ fn: getTodayMood });

  const isLoading = calendarLoading || insightLoading || todayLoading;

  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    refetchCalendar({ month, year });
    refetchInsights({ month, year });
    refetchToday(); 
  }, [currentDate]);


useFocusEffect(
  useCallback(() => {
   
const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    refetchCalendar({ month, year });
    refetchInsights({ month, year });
    refetchToday();
  }, [])
);


  const isCurrentMonth = currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => !isCurrentMonth && setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const insights = useMemo(() => {
    if (insightsRes?.success && 'totalEntries' in insightsRes) return insightsRes as MonthlyInsightsSuccessResponse;
    return null;
  }, [insightsRes]);

  const hasMonthData = insights && insights.totalEntries > 0;

  const distributionData = useMemo(() => {
    const list = MOOD_DEFS.map(m => {
      const percentageStr = insights?.moodPercentages?.[m.name] || "0%";
      const percentage = parseFloat(percentageStr);
      const count = insights?.totalEntries ? Math.round((percentage / 100) * insights.totalEntries) : 0;
      return { ...m, percentage, count };
    });
    return list.sort((a, b) => b.count - a.count);
  }, [insights]);

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const startDayIndex = firstDay === 0 ? 6 : firstDay - 1;

    const grid = [];
    for (let i = startDayIndex - 1; i >= 0; i--) grid.push({ day: daysInPrevMonth - i, isCurrent: false, key: `prev-${i}` });
    for (let i = 1; i <= daysInMonth; i++) {
      const entry = (calendarDataRes?.success && 'entries' in calendarDataRes) 
        ? calendarDataRes.entries.find((e: CalendarMoodDay) => e.day === i) : null;
      grid.push({ day: i, isCurrent: true, key: `curr-${i}`, entry });
    }
    const remainder = grid.length % 7;
    if (remainder !== 0) { for (let i = 1; i <= (7 - remainder); i++) grid.push({ day: i, isCurrent: false, key: `next-${i}` }); }
    return grid;
  }, [currentDate, calendarDataRes]);

  return (
    <SafeAreaView style={styles.container}>

      {isLoading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.text} />
          <Text style={styles.loadingText}>Fetching your insights...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
     
        <Top label='Mood Logbook' onBack={() => router.back()}/>
          {!hasMonthData && (
            <View style={styles.noDataBanner}>
              <View style={styles.infoIconCircle}><Info size={18} color={COLORS.text} /></View>
              <View style={{flex:1}}>
                <Text style={styles.noDataTitle}>Monthly Overview</Text>
                <Text style={styles.noDataSub}>No entries recorded for {currentDate.toLocaleString('default', { month: 'long' })}.</Text>
              </View>
            </View>
          )}

          {/* --- TODAY'S MOOD --- */}
          <View style={styles.sectionContainer}>
            <View style={styles.headerRow}>
              <Pin size={18} color={COLORS.text} />
              <Text style={styles.headerText}>Today's Mood</Text>
            </View>
            {todayMoodRes?.data ? (
              <View style={[styles.card, { backgroundColor: MOOD_DEFS.find(m => m.name === todayMoodRes.data?.mood)?.lightColor || '#fff' }]}>
                 <View style={styles.moodHeader}>
                   
                      <Image source={MOOD_DEFS.find(m => m.name === todayMoodRes.data?.mood)?.image} style={styles.moodImageLarge} />
             
                    <View>
                      <Text style={styles.cardTitle}>{todayMoodRes.data.mood}</Text>
                      <Text style={styles.subText}>
                        Logged today at {new Date(todayMoodRes.data.entryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
                      </Text>
                    </View>
                 </View>
                 <Text style={styles.label}>Journal:</Text>
                 <TextInput 
                   style={styles.readOnlyInput} 
                   value={todayMoodRes.data.journal || "No journal entry recorded."} 
                   editable={false} multiline
                 />
              </View>
            ) : (
              <View style={{flexDirection:'column', alignItems:'center', gap:12}}>
              <Text style={styles.emptyLabel}>You haven't logged your mood today.</Text>
              <Button label='Log Mood' onPress={()=>{router.push('../media/moodTracker')}}/>
              </View>
            )}
          </View>

          {/* --- CALENDAR --- */}
          <View style={styles.sectionContainer}>
            <View style={styles.headerRow}>
              <CalendarDays size={18} color={COLORS.text} />
              <Text style={styles.headerText}>Mood Calendar</Text>
            </View>
            <View style={[styles.card, { backgroundColor: "#FFE5D9" }]}>
              <View style={styles.calendarHeader}>
                <View style={styles.dateBadge}>
                <TouchableOpacity onPress={handlePrevMonth}><ChevronLeft size={24} color={COLORS.text} /></TouchableOpacity>
                  <Text style={styles.calendarTitle}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
                <TouchableOpacity onPress={handleNextMonth} disabled={isCurrentMonth}>
                  <ChevronRight size={24} color={COLORS.text} opacity={isCurrentMonth ? 0.3 : 1} />
                </TouchableOpacity>
                </View>
              </View>
              <View style={styles.calendarGrid}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <Text key={i} style={styles.dayLabel}>{day}</Text>)}
                {calendarGrid.map((item) => (
                  <View key={item.key} style={styles.dayCell}>
                    <Text style={[styles.dateText, !item.isCurrent && styles.dateTextDisabled]}>{item.day}</Text>
                    <View style={styles.moodDotContainer}>
                      {item.entry?.mood ? (
                        <Image source={MOOD_DEFS.find(m => m.name === item.entry?.mood)?.image} style={styles.moodImageSmall} />
                      ) : (
                        <View style={[styles.emptyDot, !item.isCurrent && styles.emptyDotDisabled]} />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* --- DONUT CHART --- */}
          <View style={styles.sectionContainer}>
            <View style={styles.headerRow}><PartyPopper size={18} color={COLORS.text} /><Text style={styles.headerText}>Your #1 Mood</Text></View>
            {hasMonthData ? (
              <View style={styles.donutSection}>
                <DonutChart 
                  data={distributionData} 
                  centerMood={MOOD_DEFS.find(m => m.name.toLowerCase() === insights.mostCommonMoods[0].mood.toLowerCase()) || MOOD_DEFS[0]} 
                />
                <Text style={styles.summaryText}>
                  {insights.mostCommonMoods.length > 1 
                    ? `Your most logged moods this month are ${insights.mostCommonMoods.map(m => m.mood).join(' and ')} with ${insights.mostCommonMoods[0].count} entries each.`
                    : `Your most logged mood this month ${isCurrentMonth ? 'is' : 'was'} ${insights.mostCommonMoods[0].mood} with ${insights.mostCommonMoods[0].count} entries.`
                  }
                </Text>
              </View>
            ) : <Text style={styles.emptyLabel}>No data to calculate insights.</Text>}
          </View>

          {/* --- DISTRIBUTION LIST --- */}
          <View style={styles.sectionContainer}>
            <View style={styles.headerRow}><PieIcon size={18} color={COLORS.text} /><Text style={styles.headerText}>Mood Distribution</Text></View>
            {hasMonthData ? (
              distributionData.filter(d => d.count > 0).map((item, idx) => (
               <View key={idx} style={[styles.distCard]}>
                <View style={styles.distLeft}>
                  {/* Update this line below */}
                  <View style={[styles.distIconBox, { backgroundColor: item.color }]}>
                    <Image source={item.image} style={styles.img24} />
                  </View>
                  
                  <View>
                    <Text style={styles.distName}>{item.name}</Text>
                    <Text style={styles.distPercent}>{item.percentage}%</Text>
                  </View>
                </View>
                <Text style={styles.distEntries}>{item.count} entries</Text>
              </View>
              ))
            ) : <Text style={styles.emptyLabel}>Log a mood to see distribution.</Text>}
          </View>

          {/* --- TAGS --- */}
          <View style={styles.sectionContainer}>
            <View style={styles.headerRow}><Tag size={18} color={COLORS.text} /><Text style={styles.headerText}>Most Logged Tags</Text></View>
            {hasMonthData && insights.topFeelings.length > 0 ? (
              <View style={styles.tagsGrid}>
                {insights.topFeelings.map((f, idx) => <TagItem key={idx} label={f.feeling} />)}
              </View>
            ) : <Text style={styles.emptyLabel}>No tags recorded this month.</Text>}
          </View>
          
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// --- HELPER COMPONENTS ---

const DonutChart = ({ data, centerMood }: { data: any[], centerMood: any }) => {
  const size = 200;
  const center = size / 2;
  const radius = 72;
  const strokeWidth = 52;

  const innerRadius = radius - strokeWidth / 2;
  const outerRadius = radius + strokeWidth / 2;
  const innerCircleSize = innerRadius * 2;

  // Only moods with actual data
  const activeMoods = data.filter(d => d.percentage > 0);

  let currentPathAngle = -90;
  let currentLineAngle = -90;

  return (
    <View style={styles.donutShadowWrapper}>
      <Svg width={size} height={size}>
        <G>

          {/* ===========================
              CASE 1: ONLY ONE MOOD
          ============================ */}
          {activeMoods.length === 1 && (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={activeMoods[0].color}
              strokeWidth={strokeWidth}
            />
          )}

          {/* ===========================
              CASE 2: MULTIPLE MOODS
          ============================ */}
          {activeMoods.length > 1 && (
            <>
              {/* Mood segments */}
              {activeMoods.map((item, i) => {
                const angle = (item.percentage / 100) * 360;
                const startAngle = currentPathAngle;

                const x1 = center + radius * Math.cos((Math.PI * startAngle) / 180);
                const y1 = center + radius * Math.sin((Math.PI * startAngle) / 180);

                currentPathAngle += angle;

                const x2 = center + radius * Math.cos((Math.PI * currentPathAngle) / 180);
                const y2 = center + radius * Math.sin((Math.PI * currentPathAngle) / 180);

                const largeArcFlag = angle > 180 ? 1 : 0;

                const d = `
                  M ${x1} ${y1}
                  A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                `;

                return (
                  <Path
                    key={`path-${i}`}
                    d={d}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                  />
                );
              })}

              {/* Divider lines */}
              {activeMoods.map((item, i) => {
                const angle = (item.percentage / 100) * 360;
                const lineAngle = currentLineAngle;
                currentLineAngle += angle;

                const lx1 = center + (innerRadius - 1) * Math.cos((Math.PI * lineAngle) / 180);
                const ly1 = center + (innerRadius - 1) * Math.sin((Math.PI * lineAngle) / 180);
                const lx2 = center + (outerRadius + 1) * Math.cos((Math.PI * lineAngle) / 180);
                const ly2 = center + (outerRadius + 1) * Math.sin((Math.PI * lineAngle) / 180);

                return (
                  <Line
                    key={`line-${i}`}
                    x1={lx1}
                    y1={ly1}
                    x2={lx2}
                    y2={ly2}
                    stroke={COLORS.text}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                );
              })}
            </>
          )}
        </G>
      </Svg>

      {/* CENTER MOOD */}
      <View
        style={[
          styles.innerCircleShadow,
          {
            width: innerCircleSize,
            height: innerCircleSize,
            borderRadius: innerRadius,
          },
        ]}
      >
        <Image source={centerMood.image} style={styles.img38} />
        <Text style={styles.centerMoodName}>{centerMood.name}</Text>
      </View>
    </View>
  );
};


const TagItem = ({ label }: { label: string }) => {
  const feelingData = feelings.find(f => f.name.toLowerCase() === label.toLowerCase());

  return (
    <View style={[styles.tagContent]}>
      {feelingData?.image ? (
        <Image source={feelingData.image} style={{width: 22, height: 22,
    resizeMode: "contain",}} />
      ) : (
        <Tag size={14} color={COLORS.text} style={{ marginRight: 4 }} />
      )}
      <Text style={styles.tagText} numberOfLines={1}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContent: { 
    paddingHorizontal: PADDING_HORIZONTAL, 
    paddingBottom: 40 
  },
  centerLoader: { 
    height: height * 0.7, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    fontFamily: "KodchasanMedium", 
    color: COLORS.text, 
    fontSize: 14 
  },
  sectionContainer: { 
    marginTop: 24 
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10, 
    gap: 6 
  },
  headerText: { 
    fontSize: 16, 
    color: COLORS.text, 
    fontFamily: "KodchasanSemiBold" 
  },
  card: { 
    width: '100%', 
    borderRadius: 16,
    padding: 16, 
    borderWidth: 4,
    borderColor: COLORS.text,
    boxShadow: '3px 3px 0px 0px #553434'
  },
  noDataBanner: { 
    flexDirection: 'row', 
    backgroundColor: '#F8F8F8', 
    padding: 14, 
    borderRadius: 14, 
    marginTop: 24, 
    alignItems: 'center', 
    borderStyle: 'dashed', 
    borderWidth: 2, 
    borderColor: '#DDD' 
  },
  infoIconCircle: { 
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12, 
    borderWidth: 1, 
    borderColor: '#DDD'
   },
  noDataTitle: { 
    fontFamily: "KodchasanSemiBold", 
    color: COLORS.text, 
    fontSize: 14 
  },
  noDataSub: { 
    fontFamily: "KodchasanMedium", 
    color: COLORS.text, 
    fontSize: 12, 
    opacity: 0.6 
  },
  emptyLabel: { 
    color: COLORS.text, 
    fontFamily: "KodchasanMedium", 
    fontSize: 14, 
    marginLeft: 4, 
    opacity : 0.7 
  },
  donutSection: { 
    alignItems: 'center', 
    marginTop: 10 
  },
  donutContainer: { 
    width: 200, 
    height: 200, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  donutCenterLabel: { 
    position: 'absolute', 
    alignItems: 'center' 
  },
  centerMoodName: { 
    fontFamily: "KodchasanSemiBold", 
    color: COLORS.text, 
    fontSize: 13, 
    marginTop: 2 
  },
  summaryText: { 
    textAlign: 'center', 
    color: COLORS.text, 
    fontFamily: "KodchasanRegular", 
    marginTop: 20, 
    fontSize: 15, 
    lineHeight: 22
  },
  distCard: { 
    backgroundColor: COLORS.cardMint, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 14, 
    marginBottom: 12, 
    boxShadow: '2px 2px 0px 0px #553434' ,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  distLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  distIconBox: { 
    padding: 6, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: COLORS.text,
    boxShadow: '2px 2px 0px 0px #553434' ,
  },
  distName: { 
    fontFamily: "KodchasanSemiBold", 
    color: COLORS.text, 
    fontSize: 14 
  },
  distPercent: { 
    fontFamily: "KodchasanRegular", 
    color: COLORS.text, 
    fontSize: 12, 
  },
  distEntries: { 
    fontFamily: "KodchasanMedium", 
    color: COLORS.text,
    fontSize: 14 
  },
  calendarHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  dateBadge: { 

    width:"100%",
     flexDirection: 'row', 
     justifyContent: 'space-between', 
    backgroundColor: '#fff', 
    paddingVertical: 8, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: COLORS.text,
    boxShadow: '2px 2px 0px 0px #553434',
  },
  calendarTitle: { 
    fontFamily: "KodchasanSemiBold", 
    color: COLORS.text, 
    fontSize: 14 
  },
  calendarGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap' 
  },
  dayLabel: { 
    width: '14.28%', 
    textAlign: 'center', 
    fontFamily: "KodchasanSemiBold", 
    marginBottom: 8, 
    color: COLORS.text 
  },
  dayCell: { 
    width: '14.28%',
    alignItems: 'center', 
    marginBottom: 12 
  },
  dateText: { 
    fontSize: 12, 
    color: COLORS.text, 
    fontFamily: "KodchasanMedium",
  },
 dateTextDisabled: {
  color: '#BCAAA4',
  textAlign: 'center',
},

moodDotContainer: {
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
},

emptyDot: {
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: COLORS.text,
  backgroundColor: '#fff',
  boxShadow: '1px 1px 0px 0px #553434',
},

emptyDotDisabled: {
  borderColor: '#BCAAA4',
  opacity: 0.5,
},

moodImageLarge: {
  width: 56,
  height: 56,
  resizeMode: 'contain',
},

moodImageSmall: {
  width: 20,
  height: 20,
  resizeMode: 'contain',
},

img38: {
  width: 38,
  height: 38,
  resizeMode: 'contain',
},

img24: {
  width: 24,
  height: 24,
  resizeMode: 'contain',
},

moodHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
  gap:6
},

moodIconCircle: {
  width: 54,
  height: 54,
  borderRadius: 27,
  backgroundColor: 'rgba(255,255,255,0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
  borderWidth: 2,
  borderColor: COLORS.text,
},

cardTitle: {
  fontSize: 18,
  fontFamily: "KodchasanSemiBold",
  color: COLORS.text,
},

subText: {
  fontSize: 12,
  fontFamily: "KodchasanMedium",
  color: COLORS.text,
  opacity: 0.8,
  marginTop: 2,
},

label: {
  fontSize: 16,
  fontFamily: "KodchasanSemiBold",
  color: COLORS.text,
  marginTop: 16,
  marginBottom: 8,
},

readOnlyInput: {
  borderRadius: 12,
  paddingVertical: 12,
  paddingHorizontal: 14,
  fontSize: 14,
  fontFamily: "KodchasanMedium",
  backgroundColor: '#fff',
  color: COLORS.text,
  borderWidth: 2,
  borderColor: COLORS.text,
  boxShadow: '2px 2px 0px 0px #553434',
},

tagsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  rowGap: 12,
  columnGap: 12,
},

tagContent: {
  width: TAG_ITEM_WIDTH, 
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFF3B0',
  paddingVertical: 10,
  paddingHorizontal: 10,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: COLORS.text,
  boxShadow: '2px 2px 0px 0px #553434',
},

tagText: {
  fontFamily: "KodchasanSemiBold",
  color: COLORS.text,
  fontSize: 13,
  textAlign: 'center',
},

donutShadowWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 100,      
    borderWidth: 2,         
    borderColor: COLORS.text,
    boxShadow: '3px 3px 0px 0px #553434', 
  },

  innerCircleShadow: {
    position: 'absolute', // Sits on top of the SVG center
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.text,
    // Matching the shadow style of the outer circle
    boxShadow: '3px 3px 0px 0px #553434',
  },

});

export default MoodLogBook;