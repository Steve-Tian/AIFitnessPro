import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementDto } from './achievements.dto';

// Slug → unlock condition evaluated after every completed workout session
const ACHIEVEMENT_RULES: Record<string, (stats: UserWorkoutStats) => boolean> = {
  first_workout: (s) => s.completedSessions >= 1,
  three_in_a_row: (s) => s.currentStreak >= 3,
  week_warrior: (s) => s.currentStreak >= 7,
  ten_sessions: (s) => s.completedSessions >= 10,
  thirty_sessions: (s) => s.completedSessions >= 30,
  century: (s) => s.completedSessions >= 100,
};

export interface UserWorkoutStats {
  completedSessions: number;
  currentStreak: number;
  longestStreak: number;
  totalDurationSeconds: number;
}

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<AchievementDto[]> {
    const [all, logs] = await Promise.all([
      this.prisma.achievement.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.achievementLog.findMany({ where: { userId } }),
    ]);

    const unlocked = new Map(logs.map((l) => [l.achievementId, l.unlockedAt]));

    return all.map((a) => ({
      id: a.id,
      slug: a.slug,
      nameCn: a.nameCn,
      descCn: a.descCn,
      iconEmoji: a.iconEmoji,
      sortOrder: a.sortOrder,
      unlockedAt: unlocked.get(a.id)?.toISOString() ?? null,
    }));
  }

  // Called after every completed workout sync; checks and awards newly earned achievements
  async checkAndAward(userId: string, stats: UserWorkoutStats): Promise<string[]> {
    const [all, existing] = await Promise.all([
      this.prisma.achievement.findMany(),
      this.prisma.achievementLog.findMany({ where: { userId }, select: { achievementId: true } }),
    ]);

    const alreadyUnlocked = new Set(existing.map((l) => l.achievementId));
    const newlyUnlocked: string[] = [];

    for (const achievement of all) {
      if (alreadyUnlocked.has(achievement.id)) continue;
      const rule = ACHIEVEMENT_RULES[achievement.slug];
      if (rule && rule(stats)) {
        await this.prisma.achievementLog.create({
          data: { userId, achievementId: achievement.id },
        });
        newlyUnlocked.push(achievement.slug);
      }
    }

    return newlyUnlocked;
  }

  async computeStats(userId: string): Promise<UserWorkoutStats> {
    const sessions = await this.prisma.workoutSession.findMany({
      where: { userId, status: 'completed' },
      orderBy: { completedAt: 'asc' },
      select: { completedAt: true, durationSeconds: true },
    });

    const completedSessions = sessions.length;
    const totalDurationSeconds = sessions.reduce((s, r) => s + (r.durationSeconds ?? 0), 0);

    // Streak: consecutive distinct calendar days with at least one completed session
    const days = [
      ...new Set(
        sessions
          .filter((s) => s.completedAt)
          .map((s) => s.completedAt!.toISOString().slice(0, 10)),
      ),
    ].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    for (let i = 0; i < days.length; i++) {
      if (i === 0) {
        streak = 1;
      } else {
        const prev = new Date(days[i - 1]);
        const cur = new Date(days[i]);
        const diff = (cur.getTime() - prev.getTime()) / 86400000;
        streak = diff === 1 ? streak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, streak);
      if (days[i] === today || days[i] === yesterday) {
        currentStreak = streak;
      }
    }

    return { completedSessions, currentStreak, longestStreak, totalDurationSeconds };
  }
}
