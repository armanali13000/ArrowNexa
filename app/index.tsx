import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppBackground } from '../components/layout/AppBackground';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Button, PrimaryButton, SecondaryButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BoltIcon, StarIcon } from '../components/ui/Icons';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Text } from '../components/ui/Text';
import { TOTAL_LEVELS } from '../constants/levels';
import { useTheme } from '../hooks/useTheme';
import { loadGameplaySession } from '../services/gameplay/sessionStorage';
import { getAppCopy, getUiText } from '../services/i18n/appCopy';
import { getChapterForLevel } from '../services/progression/chapterService';
import { getDailyDifficulty, getDailyStatus } from '../services/progression/dailyChallengeService';
import { getLocalDateKey } from '../services/progression/dateService';
import { ensureWeeklyChallenge } from '../services/progression/weeklyChallengeService';
import { xpRequiredForRank } from '../services/progression/xpService';
import { useProgressStore } from '../store/progress/progressStore';
import { useSettingsStore } from '../store/settings/settingsStore';

export default function HomeScreen() {
  const theme = useTheme();
  const language = useSettingsStore((state) => state.language);
  const currentLevel = useProgressStore((state) => state.currentLevel);
  const completedLevels = useProgressStore((state) => state.completedLevels);
  const hints = useProgressStore((state) => state.hints);
  const xp = useProgressStore((state) => state.xp);
  const nexaRank = useProgressStore((state) => state.nexaRank);
  const progress = useProgressStore();
  const [hasSession, setHasSession] = useState(false);
  const stars = Object.values(completedLevels).reduce((sum, value) => sum + value, 0);
  const chapter = getChapterForLevel(currentLevel);
  const today = getLocalDateKey();
  const dailyStatus = getDailyStatus(progress, today);
  const weekly = ensureWeeklyChallenge(progress);
  const weeklyPreview = weekly.objectives[0];
  const copy = getAppCopy(language);
  const t = (text: string) => getUiText(language, text);
  const menu = [
    { title: copy.menuLevels, route: '/levels' },
    { title: copy.menuDaily, route: '/daily' },
    { title: copy.menuWeeklyGoals, route: '/weekly' },
    { title: copy.menuProgress, route: '/progress' },
    { title: copy.menuAchievements, route: '/achievements' },
    { title: copy.menuStatistics, route: '/statistics' },
    { title: copy.menuHowToPlay, route: '/tutorial' },
    { title: copy.menuSettings, route: '/settings' },
  ] as const;
  const chapterCompleted = Array.from({ length: chapter.endLevel - chapter.startLevel + 1 }, (_, index) => chapter.startLevel + index).filter((level) => completedLevels[level]).length;

  useEffect(() => {
    loadGameplaySession().then((session) => setHasSession(Boolean(session))).catch(() => undefined);
  }, []);

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(260)} style={styles.brand}>
          <BrandLogo />
          <View style={styles.brandCopy}>
            <Text variant="display">ArrowNexa</Text>
            <Text variant="title" color={theme.colors.textSecondary}>{copy.homeSubtitle}</Text>
          </View>
        </Animated.View>

        <Card>
          <View style={styles.row}>
            <View>
              <Text variant="caption" color={theme.colors.textSecondary}>{copy.currentLevel}</Text>
              <Text variant="heading1">{copy.level} {currentLevel}</Text>
              <Text variant="caption" color={theme.colors.textSecondary}>{copy.nexaRank} {nexaRank} - {xp} / {xpRequiredForRank(nexaRank)} XP</Text>
            </View>
            <View style={styles.wallet}>
              <View style={styles.walletItem}><StarIcon color={theme.colors.accent} /><Text variant="title">{stars}</Text></View>
              <View style={styles.walletItem}><BoltIcon color={theme.colors.primary} /><Text variant="title">{hints}</Text></View>
            </View>
          </View>
          <View style={styles.progressCopy}>
            <Text variant="bodySmall" color={theme.colors.textSecondary}>{copy.difficulty}: {t('Normal')}</Text>
            <Text variant="bodySmall" color={theme.colors.textSecondary}>{copy.progress}: {currentLevel} / {TOTAL_LEVELS}</Text>
          </View>
          <ProgressBar value={currentLevel / TOTAL_LEVELS} />
        </Card>

        <Card>
          <Text variant="heading2">{copy.chapter} {chapter.chapter}</Text>
          <Text variant="title" color={theme.colors.textSecondary}>{chapter.name}</Text>
          <View style={styles.progressCopy}>
            <Text variant="bodySmall" color={theme.colors.textSecondary}>{copy.level} {currentLevel} / {chapter.endLevel}</Text>
            <Text variant="bodySmall" color={theme.colors.textSecondary}>{chapterCompleted} / 50 {copy.complete}</Text>
          </View>
          <ProgressBar value={chapterCompleted / 50} />
        </Card>

        <PrimaryButton title={hasSession ? copy.continue : copy.play} accessibilityLabel={t('Play latest unlocked level')} onPress={() => router.push('/game')} style={styles.play} />

        <Card style={styles.dailyCard}>
          <View>
            <Text variant="caption">{copy.dailyChallenge}</Text>
            <Text variant="heading2">{t(getDailyDifficulty(today))}</Text>
            <Text variant="bodySmall" color={theme.colors.textSecondary}>{t(dailyStatus)} - {t('Streak')} {progress.challengeStreak.current}</Text>
          </View>
          <SecondaryButton title={dailyStatus === 'Not Played' ? copy.play : copy.open} onPress={() => router.push('/daily')} style={styles.dailyButton} />
        </Card>

        {weeklyPreview ? (
          <Card style={styles.weeklyPreview}>
            <Text variant="caption">{copy.weeklyGoal}</Text>
            <Text variant="bodySmall">{t(weeklyPreview.title)}</Text>
            <ProgressBar value={weeklyPreview.progress / weeklyPreview.target} />
          </Card>
        ) : null}

        <View style={styles.menuGrid}>
          {menu.map((item) => (
            <SecondaryButton
              key={item.title}
              title={item.title}
              onPress={() => router.push(item.route)}
              style={styles.menuButton}
            />
          ))}
        </View>
        <Button title={`${copy.about} ArrowNexa`} variant="ghost" onPress={() => router.push('/about')} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 34,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
  },
  brandCopy: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  wallet: {
    gap: 8,
    alignItems: 'flex-end',
  },
  walletItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  progressCopy: {
    marginTop: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  play: {
    minHeight: 64,
  },
  dailyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  dailyButton: {
    minWidth: 96,
  },
  weeklyPreview: {
    gap: 8,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuButton: {
    width: '48%',
  },
});
