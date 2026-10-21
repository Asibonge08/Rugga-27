// src/managers.ts
// Master Milestone, Economy & Inbox Managers for Rugga 27

import { CareerMilestone, Player, Club, InboxMessage } from './types/rugby';

// --- 1. MILESTONE MANAGER ---

export interface MilestoneEvaluationContext {
  unbeatenRun: number;
  academyStartersCount: number;
  wonTrophy: boolean;
  maxPointsInMatch: number;
  cleanSheetWon: boolean;
  derbyWins: number;
  clubCoins: number;
}

export class MilestoneManager {
  public static evaluateMilestones(
    milestones: CareerMilestone[],
    context: MilestoneEvaluationContext
  ): { updatedMilestones: CareerMilestone[]; newlyUnlocked: CareerMilestone[] } {
    const newlyUnlocked: CareerMilestone[] = [];
    const updated = milestones.map(m => {
      if (m.unlocked) return m;

      let currentProg = m.progress;
      let shouldUnlock = false;

      switch (m.id) {
        case 'unbeaten_10':
          currentProg = context.unbeatenRun;
          shouldUnlock = currentProg >= m.target;
          break;
        case 'academy_debut':
          currentProg = Math.max(currentProg, context.academyStartersCount);
          shouldUnlock = currentProg >= m.target;
          break;
        case 'first_trophy':
          currentProg = context.wonTrophy ? 1 : 0;
          shouldUnlock = context.wonTrophy;
          break;
        case 'derby_conqueror':
          currentProg = context.derbyWins;
          shouldUnlock = currentProg >= m.target;
          break;
        case 'high_roller_50':
          currentProg = Math.max(currentProg, context.maxPointsInMatch);
          shouldUnlock = currentProg >= m.target;
          break;
        case 'clean_sheet':
          currentProg = context.cleanSheetWon ? 1 : 0;
          shouldUnlock = context.cleanSheetWon;
          break;
        case 'financial_titan':
          currentProg = Math.max(currentProg, context.clubCoins);
          shouldUnlock = currentProg >= m.target;
          break;
      }

      if (shouldUnlock && !m.unlocked) {
        const unlockedBadge: CareerMilestone = {
          ...m,
          progress: m.target,
          unlocked: true,
          unlockedDate: 'Season 2025-26'
        };
        newlyUnlocked.push(unlockedBadge);
        return unlockedBadge;
      }

      return {
        ...m,
        progress: Math.min(m.target, currentProg)
      };
    });

    return { updatedMilestones: updated, newlyUnlocked };
  }

  /**
   * Generates deep-linked inbox alert for an unlocked milestone
   */
  public static createMilestoneInboxAlert(milestone: CareerMilestone, weekNumber: number): InboxMessage {
    const tierEmoji = milestone.tier === 'PLATINUM' ? '🏆' : milestone.tier === 'GOLD' ? '🥇' : milestone.tier === 'SILVER' ? '🥈' : '🥉';
    return {
      id: `milestone_${milestone.id}_${Date.now()}`,
      date: `Week ${weekNumber}`,
      sender: 'URC Board of Governors',
      subject: `${tierEmoji} Milestone Unlocked: ${milestone.title}!`,
      body: `Congratulations! Your club has achieved the "${milestone.title}" career milestone.\n\n` +
            `"${milestone.description}"\n\n` +
            `Board Bonus Reward: +${milestone.rewardCoins.toLocaleString()} Rugby Coins credited to club treasury.`,
      category: 'BOARD',
      read: false,
      actionRoute: {
        screen: 'dashboard',
        targetEntityId: milestone.id,
        label: 'View Hall of Fame'
      }
    };
  }
}

// --- 2. ECONOMY MANAGER ---

export class EconomyManager {
  /**
   * Calculates matchday ticket revenue based on attendance and ticket price
   * Formula: (Attendance × Ticket Price) - 20% Operational Expenses
   */
  public static calculateMatchdayTicketRevenue(
    stadiumCapacity: number,
    ticketPrice: number = 28,
    fanSatisfaction: number = 82,
    isDerby: boolean = false
  ): { grossRevenue: number; operationalExpenses: number; netProfit: number; attendance: number } {
    // Attendance percentage based on fan satisfaction & derby excitement
    const satisfactionFactor = (fanSatisfaction / 100) * 0.85 + 0.15;
    const derbyBonus = isDerby ? 0.12 : 0;
    const attendanceRate = Math.min(1.0, Math.max(0.40, satisfactionFactor + derbyBonus));
    const attendance = Math.round(stadiumCapacity * attendanceRate);

    const grossRevenue = attendance * ticketPrice;
    const operationalExpenses = Math.round(grossRevenue * 0.20); // 20% operational costs
    const netProfit = grossRevenue - operationalExpenses;

    return {
      grossRevenue,
      operationalExpenses,
      netProfit,
      attendance
    };
  }

  /**
   * Calculates realistic weekly player wage based on overall rating, potential, and age
   */
  public static calculatePlayerWeeklyWage(player: { overall: number; potential: number; age: number }): number {
    const baseOvr = Math.max(60, player.overall);
    // Base exponential scale
    const baseWage = Math.round(Math.pow(baseOvr / 10, 3.7) * 2.8);
    // Young star premium
    const youngStarFactor = (player.age <= 23 && player.potential >= 90) ? 1.25 : 1.0;
    // Veteran experience factor
    const veteranFactor = (player.age >= 31 && baseOvr >= 85) ? 1.15 : 1.0;

    return Math.round(baseWage * youngStarFactor * veteranFactor);
  }

  /**
   * Calculates realistic facility tier upgrade costs (e.g. 250,000 coins for Academy upgrades)
   */
  public static getFacilityUpgradeCost(facilityType: 'academy' | 'training' | 'medical' | 'stadium' | 'analytics', currentLevel: number): number {
    if (currentLevel >= 5) return 0; // Max tier

    switch (facilityType) {
      case 'academy':
        return 250000 * currentLevel; // 250,000 coins baseline
      case 'training':
        return 200000 * currentLevel;
      case 'medical':
        return 180000 * currentLevel;
      case 'stadium':
        return 350000 * currentLevel;
      case 'analytics':
        return 150000 * currentLevel;
      default:
        return 200000 * currentLevel;
    }
  }
}

// --- 3. INBOX MANAGER ---

export class InboxManager {
  /**
   * Bulk operation to mark all messages in inbox as read at once
   */
  public static markAllAsRead(messages: InboxMessage[]): InboxMessage[] {
    return messages.map(msg => ({ ...msg, read: true }));
  }

  /**
   * Mark an individual message as read
   */
  public static markAsRead(messages: InboxMessage[], messageId: string): InboxMessage[] {
    return messages.map(msg => msg.id === messageId ? { ...msg, read: true } : msg);
  }

  /**
   * Filter unread message count
   */
  public static getUnreadCount(messages: InboxMessage[]): number {
    return messages.filter(m => !m.read).length;
  }
}
