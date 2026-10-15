import { Club, Player } from '../types/rugby';
import { INITIAL_CLUBS } from '../data/rugbyDatabase';
import { careerManager } from './careerManager';

const CUSTOM_CLUBS_KEY = 'rugga_27_custom_clubs_v1';
const CUSTOM_PLAYERS_KEY = 'rugga_27_custom_players_v1';

export interface CustomDatabaseState {
  clubs: Record<string, Partial<Club>>;
  players: Record<string, Player>;
  lastUpdated: number;
}

class CustomDbService {
  private customClubs: Record<string, Partial<Club>> = {};
  private customPlayers: Record<string, Player> = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const clubsData = localStorage.getItem(CUSTOM_CLUBS_KEY);
      if (clubsData) {
        this.customClubs = JSON.parse(clubsData);
      }
      const playersData = localStorage.getItem(CUSTOM_PLAYERS_KEY);
      if (playersData) {
        this.customPlayers = JSON.parse(playersData);
      }
    } catch {
      // storage unavailable
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(CUSTOM_CLUBS_KEY, JSON.stringify(this.customClubs));
      localStorage.setItem(CUSTOM_PLAYERS_KEY, JSON.stringify(this.customPlayers));
    } catch {
      // ignore
    }
  }

  /**
   * Get all clubs merged with custom edits
   */
  public getClubs(): Club[] {
    return INITIAL_CLUBS.map(base => {
      const custom = this.customClubs[base.id];
      if (custom) {
        return { ...base, ...custom };
      }
      return {
        ...base,
        city: base.city || base.stadiumName.split(',').pop()?.trim() || base.country,
        pitchType: base.pitchType || 'Natural Hybrid Grass',
        weatherProfile: base.weatherProfile || (base.country === 'South Africa' ? 'Dry' : base.country === 'Ireland' || base.country === 'Scotland' ? 'Wet' : 'Windy')
      };
    });
  }

  /**
   * Update a specific club's details (Name, Short Name, Kit colors, Stadium, Pitch Type, Weather)
   */
  public updateClub(clubId: string, updates: Partial<Club>): Club {
    const existing = this.customClubs[clubId] || {};
    this.customClubs[clubId] = { ...existing, ...updates };
    this.saveToStorage();

    // If active career has this club, update it there too
    const activeState = careerManager.getState();
    const activeClubIdx = activeState.clubs.findIndex(c => c.id === clubId);
    if (activeClubIdx !== -1) {
      careerManager.updateClubDetails(clubId, updates);
    }

    const clubs = this.getClubs();
    return clubs.find(c => c.id === clubId)!;
  }

  /**
   * Update or override a player
   */
  public updatePlayer(player: Player): void {
    this.customPlayers[player.id] = player;
    this.saveToStorage();

    // Also update in active career manager
    careerManager.updatePlayer(player);
  }

  /**
   * Push all custom changes to active save
   */
  public pushAllToActiveSave(): { success: boolean; message: string } {
    const activeState = careerManager.getState();
    let clubCount = 0;
    let playerCount = 0;

    Object.entries(this.customClubs).forEach(([clubId, updates]) => {
      careerManager.updateClubDetails(clubId, updates);
      clubCount++;
    });

    Object.values(this.customPlayers).forEach(player => {
      careerManager.updatePlayer(player);
      playerCount++;
    });

    return {
      success: true,
      message: `Successfully synchronized ${clubCount} clubs and ${playerCount} player edits into your active save!`
    };
  }

  /**
   * Reset database to factory default values
   */
  public resetToDefaults(): void {
    this.customClubs = {};
    this.customPlayers = {};
    localStorage.removeItem(CUSTOM_CLUBS_KEY);
    localStorage.removeItem(CUSTOM_PLAYERS_KEY);
  }

  public hasCustomEdits(): boolean {
    return Object.keys(this.customClubs).length > 0 || Object.keys(this.customPlayers).length > 0;
  }
}

export const customDbService = new CustomDbService();
