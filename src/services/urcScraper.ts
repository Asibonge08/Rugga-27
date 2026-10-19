// src/services/urcScraper.ts
// Service to fetch player data from the official URC Stats website (https://stats.unitedrugby.com/clubs)
// Implements aligned mock data structure simulating successful data retrieval for all 16 clubs,
// with calibrated international-level player ratings (88-96) and deduplicated rosters.

import { RugbyPosition } from '../types/rugby';

export interface UrcScrapedClub {
  id: number;              // Official URC API ID (e.g. 1527 for Sharks, 3994 for Stormers)
  clubId: string;          // Stable internal ID (e.g. 'sharks_urc', 'stormers')
  fullName: string;        // Official displayed club name
  shortName: string;       // 3-letter abbreviation (e.g. 'SHA', 'STO')
  foundedYear: string;
  clubSite: string;
  country: string;
  officialStatsUrl: string;
}

export interface UrcScrapedPlayer {
  playerId: number;
  firstName: string;
  lastName: string;
  knownName: string;
  officialPositionName: string;
  primaryPosition: RugbyPosition;
  secondaryPositions: RugbyPosition[];
  clubId: string;
  clubName: string;
  dob?: string;
  age: number;
  heightCm: number;
  weightKg: number;
  nationality: string;
  overall: number;          // Calibrated realistic rating (international stars: 88-96)
  potential: number;
  isInternational: boolean;
  marketValue: number;
  weeklyWage: number;
  headshots?: string;
  profileUrl: string;
}

export interface UrcScraperResponse {
  success: boolean;
  sourceUrl: string;
  totalClubs: number;
  totalPlayers: number;
  clubs: UrcScrapedClub[];
  players: UrcScrapedPlayer[];
  timestamp: string;
  isMockSimulation: boolean;
  notes: string;
}

// Calibrated high ratings for international-caliber test stars
export const INTERNATIONAL_RATINGS: Record<string, { overall: number; potential: number; isInternational: boolean }> = {
  // Springboks & South Africa Stars
  'eben etzebeth': { overall: 96, potential: 97, isInternational: true },
  'ox nche': { overall: 95, potential: 96, isInternational: true },
  'frans malherbe': { overall: 95, potential: 96, isInternational: true },
  'kurt-lee arendse': { overall: 95, potential: 96, isInternational: true },
  'handre pollard': { overall: 95, potential: 96, isInternational: true },
  'damian willemse': { overall: 95, potential: 96, isInternational: true },
  'canan moodie': { overall: 94, potential: 96, isInternational: true },
  'grant williams': { overall: 93, potential: 94, isInternational: true },
  'bongi mbonambi': { overall: 93, potential: 94, isInternational: true },
  'andre esterhuizen': { overall: 93, potential: 94, isInternational: true },
  'andré esterhuizen': { overall: 93, potential: 94, isInternational: true },
  'willie le roux': { overall: 92, potential: 93, isInternational: true },
  'thomas du toit': { overall: 92, potential: 93, isInternational: true },
  'vincent koch': { overall: 92, potential: 93, isInternational: true },
  'elrigh louw': { overall: 92, potential: 94, isInternational: true },
  'sacha feinberg-mngomezulu': { overall: 92, potential: 96, isInternational: true },
  'wilco louw': { overall: 92, potential: 93, isInternational: true },
  'makazole mapimpi': { overall: 91, potential: 92, isInternational: true },
  'manie libbok': { overall: 91, potential: 93, isInternational: true },
  'gerhard steenekamp': { overall: 91, potential: 92, isInternational: true },
  'marco van staden': { overall: 91, potential: 92, isInternational: true },
  'evan roos': { overall: 91, potential: 93, isInternational: true },
  'cameron hanekom': { overall: 91, potential: 95, isInternational: true },
  'jean kleyn': { overall: 91, potential: 92, isInternational: true },
  'rg snyman': { overall: 95, potential: 96, isInternational: true },
  'trevor nyakane': { overall: 90, potential: 91, isInternational: true },
  'johan grobbelaar': { overall: 90, potential: 92, isInternational: true },
  'ruan nortje': { overall: 90, potential: 92, isInternational: true },
  'jaden hendrikse': { overall: 89, potential: 92, isInternational: true },
  'jordan hendrikse': { overall: 88, potential: 92, isInternational: true },
  'edwill van der merwe': { overall: 89, potential: 91, isInternational: true },
  'ben-jason dixon': { overall: 89, potential: 92, isInternational: true },
  'jan-hendrik wessels': { overall: 89, potential: 93, isInternational: true },
  'sanele nohamba': { overall: 89, potential: 91, isInternational: true },
  'francke horn': { overall: 89, potential: 91, isInternational: true },
  'quan horn': { overall: 88, potential: 91, isInternational: true },
  'morne van den berg': { overall: 88, potential: 90, isInternational: true },
  'ruan venter': { overall: 88, potential: 92, isInternational: true },
  'henco van wyk': { overall: 88, potential: 92, isInternational: true },
  'dan du plessis': { overall: 89, potential: 90, isInternational: true },
  'salmaan moerat': { overall: 89, potential: 91, isInternational: true },
  'deon fourie': { overall: 89, potential: 89, isInternational: true },
  'warrick gelant': { overall: 89, potential: 90, isInternational: true },
  'phepsi buthelezi': { overall: 88, potential: 91, isInternational: true },
  'vincent tshituka': { overall: 88, potential: 90, isInternational: true },
  'jason jenkins': { overall: 88, potential: 89, isInternational: true },
  'siya masuku': { overall: 87, potential: 89, isInternational: true },
  'neethling fouche': { overall: 88, potential: 89, isInternational: true },
  'ruben van heerden': { overall: 88, potential: 89, isInternational: true },
  'joseph dweba': { overall: 88, potential: 89, isInternational: true },

  // Ireland & Leinster / Munster / Ulster / Connacht Stars
  'caelan doris': { overall: 96, potential: 97, isInternational: true },
  'dan sheehan': { overall: 95, potential: 97, isInternational: true },
  'jamison gibson-park': { overall: 95, potential: 96, isInternational: true },
  'josh van der flier': { overall: 95, potential: 96, isInternational: true },
  'tadhg beirne': { overall: 95, potential: 96, isInternational: true },
  'bundee aki': { overall: 95, potential: 96, isInternational: true },
  'james lowe': { overall: 94, potential: 95, isInternational: true },
  'garry ringrose': { overall: 94, potential: 95, isInternational: true },
  'tadhg furlong': { overall: 94, potential: 95, isInternational: true },
  'andrew porter': { overall: 94, potential: 95, isInternational: true },
  'hugo keenan': { overall: 94, potential: 95, isInternational: true },
  'jack crowley': { overall: 93, potential: 96, isInternational: true },
  'james ryan': { overall: 93, potential: 94, isInternational: true },
  'mack hansen': { overall: 93, potential: 95, isInternational: true },
  'jordie barrett': { overall: 95, potential: 96, isInternational: true },
  'peter o\'mahony': { overall: 92, potential: 92, isInternational: true },
  'joe mccarthy': { overall: 92, potential: 95, isInternational: true },
  'iain henderson': { overall: 91, potential: 92, isInternational: true },
  'stuart mccloskey': { overall: 91, potential: 92, isInternational: true },
  'finlay bealham': { overall: 91, potential: 92, isInternational: true },
  'ronan kelleher': { overall: 91, potential: 93, isInternational: true },
  'craig casey': { overall: 90, potential: 93, isInternational: true },
  'calvin nash': { overall: 90, potential: 92, isInternational: true },
  'jack conan': { overall: 90, potential: 91, isInternational: true },
  'ryan baird': { overall: 90, potential: 93, isInternational: true },
  'gavin coombes': { overall: 90, potential: 92, isInternational: true },
  'jacob stockdale': { overall: 90, potential: 91, isInternational: true },
  'nick timoney': { overall: 90, potential: 92, isInternational: true },
  'cian prendergast': { overall: 90, potential: 93, isInternational: true },
  'john hodnett': { overall: 89, potential: 92, isInternational: true },
  'tom o\'toole': { overall: 89, potential: 91, isInternational: true },
  'rob herring': { overall: 89, potential: 89, isInternational: true },
  'caolin blade': { overall: 88, potential: 89, isInternational: true },
  'ciaran frawley': { overall: 89, potential: 92, isInternational: true },
  'jamie osborne': { overall: 88, potential: 92, isInternational: true },
  'sam prendergast': { overall: 87, potential: 94, isInternational: true },

  // Scotland & Glasgow / Edinburgh Stars
  'sione tuipulotu': { overall: 94, potential: 95, isInternational: true },
  'duhan van der merwe': { overall: 94, potential: 95, isInternational: true },
  'huw jones': { overall: 93, potential: 94, isInternational: true },
  'zander fagerson': { overall: 93, potential: 94, isInternational: true },
  'pierre schoeman': { overall: 93, potential: 94, isInternational: true },
  'darcy graham': { overall: 93, potential: 94, isInternational: true },
  'hamish watson': { overall: 92, potential: 92, isInternational: true },
  'rory darge': { overall: 92, potential: 94, isInternational: true },
  'matt fagerson': { overall: 91, potential: 93, isInternational: true },
  'jamie ritchie': { overall: 91, potential: 92, isInternational: true },
  'jack dempsey': { overall: 91, potential: 92, isInternational: true },
  'kyle steyn': { overall: 90, potential: 91, isInternational: true },
  'scott cummings': { overall: 90, potential: 92, isInternational: true },
  'grant gilchrist': { overall: 89, potential: 89, isInternational: true },
  'ewan ashman': { overall: 89, potential: 92, isInternational: true },
  'ali price': { overall: 89, potential: 89, isInternational: true },
  'george horne': { overall: 89, potential: 90, isInternational: true },
  'tom jordan': { overall: 89, potential: 91, isInternational: true },
  'johnny matthews': { overall: 89, potential: 90, isInternational: true },
  'stafford mcdowall': { overall: 88, potential: 90, isInternational: true },
  'adam hastings': { overall: 88, potential: 90, isInternational: true },

  // Italy Stars
  'tommaso menoncello': { overall: 94, potential: 96, isInternational: true },
  'michele lamaro': { overall: 93, potential: 94, isInternational: true },
  'ignacio brex': { overall: 92, potential: 93, isInternational: true },
  'paolo garbisi': { overall: 92, potential: 94, isInternational: true },
  'danilo fischetti': { overall: 91, potential: 93, isInternational: true },
  'federico ruzza': { overall: 90, potential: 91, isInternational: true },
  'sebastian negri': { overall: 90, potential: 91, isInternational: true },
  'thomas gallo': { overall: 90, potential: 93, isInternational: true },
  'lorenzo cannone': { overall: 89, potential: 93, isInternational: true },
  'simone ferrari': { overall: 89, potential: 89, isInternational: true },
  'mirco spagnolo': { overall: 88, potential: 92, isInternational: true },
  'alessandro garbisi': { overall: 87, potential: 90, isInternational: true },
  'rhyno smith': { overall: 88, potential: 89, isInternational: true },
  'gese simone': { overall: 88, potential: 91, isInternational: true },
  'andrea zambonin': { overall: 88, potential: 91, isInternational: true },
  'gonzalo garcia': { overall: 88, potential: 90, isInternational: true },
  'giovanni licata': { overall: 88, potential: 90, isInternational: true },

  // Wales Stars
  'jac morgan': { overall: 94, potential: 96, isInternational: true },
  'dewi lake': { overall: 93, potential: 95, isInternational: true },
  'taulupe faletau': { overall: 93, potential: 93, isInternational: true },
  'josh adams': { overall: 92, potential: 92, isInternational: true },
  'aaron wainwright': { overall: 92, potential: 94, isInternational: true },
  'adam beard': { overall: 91, potential: 92, isInternational: true },
  'justin tipuric': { overall: 91, potential: 91, isInternational: true },
  'gareth thomas': { overall: 90, potential: 91, isInternational: true },
  'rio dyer': { overall: 90, potential: 93, isInternational: true },
  'gareth davies': { overall: 90, potential: 90, isInternational: true },
  'sam costelow': { overall: 89, potential: 92, isInternational: true },
  'elliot dee': { overall: 89, potential: 90, isInternational: true },
  'mason grady': { overall: 89, potential: 93, isInternational: true },
  'cameron winnett': { overall: 88, potential: 92, isInternational: true },
  'ben thomas': { overall: 89, potential: 91, isInternational: true },
  'morgan morris': { overall: 89, potential: 91, isInternational: true },
  'owen watkin': { overall: 88, potential: 89, isInternational: true },
  'james botham': { overall: 88, potential: 90, isInternational: true },
  'taine plumtree': { overall: 88, potential: 91, isInternational: true },
  'kemsley mathias': { overall: 88, potential: 91, isInternational: true },
  'ryan elias': { overall: 88, potential: 89, isInternational: true },
  'leon brown': { overall: 88, potential: 89, isInternational: true },
  'keiran williams': { overall: 88, potential: 90, isInternational: true },
  'blair murray': { overall: 88, potential: 93, isInternational: true },
  'vaea fifita': { overall: 91, potential: 91, isInternational: true },
  'sam lousi': { overall: 89, potential: 90, isInternational: true }
};

export const OFFICIAL_URC_CLUBS: UrcScrapedClub[] = [
  { id: 1527, clubId: 'sharks_urc', fullName: 'Hollywoodbets Sharks', shortName: 'SHA', foundedYear: '1995', clubSite: 'https://sharksrugby.co.za/', country: 'South Africa', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 1641, clubId: 'edinburgh', fullName: 'Edinburgh Rugby', shortName: 'EDI', foundedYear: '1872', clubSite: 'https://edinburghrugby.org/', country: 'Scotland', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 2019, clubId: 'benetton', fullName: 'Benetton Rugby', shortName: 'BEN', foundedYear: '1932', clubSite: 'https://benettonrugby.it/', country: 'Italy', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 2129, clubId: 'ulster', fullName: 'Ulster Rugby', shortName: 'ULS', foundedYear: '1879', clubSite: 'https://ulster.rugby/', country: 'Ireland', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 3098, clubId: 'glasgow', fullName: 'Glasgow Warriors', shortName: 'GLA', foundedYear: '1872', clubSite: 'https://glasgowwarriors.org/', country: 'Scotland', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 3514, clubId: 'scarlets', fullName: 'Scarlets', shortName: 'SCA', foundedYear: '2003', clubSite: 'https://www.scarlets.wales/', country: 'Wales', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 3533, clubId: 'dragons', fullName: 'Dragons RFC', shortName: 'DRA', foundedYear: '2003', clubSite: 'https://dragonsrfc.wales/index.html', country: 'Wales', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 3994, clubId: 'stormers', fullName: 'DHL Stormers', shortName: 'STO', foundedYear: '1997', clubSite: 'https://stormers.co.za/home/', country: 'South Africa', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 4377, clubId: 'munster', fullName: 'Munster Rugby', shortName: 'MUN', foundedYear: '1879', clubSite: 'https://www.munsterrugby.ie/', country: 'Ireland', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 4471, clubId: 'cardiff', fullName: 'Cardiff Rugby', shortName: 'CAR', foundedYear: '1876', clubSite: 'https://www.cardiffrugby.wales/', country: 'Wales', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 4474, clubId: 'zebre', fullName: 'Zebre Parma', shortName: 'ZEB', foundedYear: '1973', clubSite: 'https://www.zebreparma.it/', country: 'Italy', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 5057, clubId: 'ospreys', fullName: 'Ospreys', shortName: 'OSP', foundedYear: '2003', clubSite: 'https://www.ospreysrugby.com/', country: 'Wales', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 5092, clubId: 'lions', fullName: 'Fidelity Securedrive Lions', shortName: 'LIO', foundedYear: '1996', clubSite: 'https://lionsrugby.co.za/', country: 'South Africa', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 5356, clubId: 'leinster', fullName: 'Leinster Rugby', shortName: 'LEI', foundedYear: '1879', clubSite: 'https://www.leinsterrugby.ie/', country: 'Ireland', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 5483, clubId: 'connacht', fullName: 'Connacht Rugby', shortName: 'CON', foundedYear: '1885', clubSite: 'https://www.connachtrugby.ie/', country: 'Ireland', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' },
  { id: 5586, clubId: 'bulls', fullName: 'Vodacom Bulls', shortName: 'BUL', foundedYear: '1938', clubSite: 'https://bullsrugby.co.za/', country: 'South Africa', officialStatsUrl: 'https://stats.unitedrugby.com/clubs' }
];

/**
 * Normalizes and maps raw position strings from the official site into strict RugbyPosition
 */
export function normalizePosition(rawPos: string, defaultBack: boolean = false): RugbyPosition {
  const p = (rawPos || '').toLowerCase().trim();
  if (p.includes('loosehead') || p === 'loosehead-prop') return 'LH_PROP';
  if (p.includes('tighthead') || p === 'tighthead-prop') return 'TH_PROP';
  if (p === 'prop') return defaultBack ? 'TH_PROP' : 'LH_PROP';
  if (p === 'hooker') return 'HOOKER';
  if (p === 'lock' || p === 'second-row') return defaultBack ? 'LOCK_5' : 'LOCK_4';
  if (p.includes('blindside')) return 'BLINDSIDE_FLANKER';
  if (p.includes('openside')) return 'OPENSIDE_FLANKER';
  if (p === 'flanker') return defaultBack ? 'OPENSIDE_FLANKER' : 'BLINDSIDE_FLANKER';
  if (p === 'no. 8' || p === 'number-eight' || p === 'number 8' || p === 'eight') return 'NUMBER_8';
  if (p === 'scrum-half') return 'SCRUM_HALF';
  if (p === 'fly-half' || p === 'stand-off') return 'FLY_HALF';
  if (p === 'inside-centre') return 'INSIDE_CENTRE';
  if (p === 'outside-centre') return 'OUTSIDE_CENTRE';
  if (p === 'centre') return defaultBack ? 'OUTSIDE_CENTRE' : 'INSIDE_CENTRE';
  if (p === 'left-wing') return 'LEFT_WING';
  if (p === 'right-wing') return 'RIGHT_WING';
  if (p === 'wing') return defaultBack ? 'RIGHT_WING' : 'LEFT_WING';
  if (p === 'fullback') return 'FULLBACK';
  return defaultBack ? 'INSIDE_CENTRE' : 'BLINDSIDE_FLANKER';
}

/**
 * Deduplicates scraped players and strictly removes duplicates (e.g. duplicate Lombard on Sharks)
 */
export function deduplicateScrapedPlayers(players: UrcScrapedPlayer[]): UrcScrapedPlayer[] {
  const seenIds = new Set<number>();
  const seenClubNames = new Set<string>();
  const result: UrcScrapedPlayer[] = [];

  for (const player of players) {
    if (seenIds.has(player.playerId)) continue;
    
    // Check duplicate name within the same club (e.g. duplicate Lombard on Sharks)
    const clubNameKey = `${player.clubId}__${player.knownName.toLowerCase().trim()}`;
    if (seenClubNames.has(clubNameKey)) continue;

    seenIds.add(player.playerId);
    seenClubNames.add(clubNameKey);
    result.push(player);
  }

  return result;
}

/**
 * Applies realistic ratings calibrated to international test caliber
 */
export function calibratePlayerRating(player: { name: string; age?: number; primaryPosition: RugbyPosition; baseOverall?: number }): { overall: number; potential: number; isInternational: boolean } {
  const lower = player.name.toLowerCase().trim();
  const calibrated = INTERNATIONAL_RATINGS[lower];

  if (calibrated) {
    return calibrated;
  }

  const age = player.age || 25;
  let overall = player.baseOverall || 77;
  if (age >= 25 && age <= 30) overall = Math.max(overall, 79);
  else if (age > 30) overall = Math.max(overall, 78);
  else overall = Math.max(overall, 74);

  const potential = Math.min(95, Math.max(overall, age <= 23 ? overall + 9 : overall + 2));
  return {
    overall,
    potential,
    isInternational: overall >= 88
  };
}

/**
 * Fetch player data from the official URC Stats website
 * Supports live GraphQL API requests with graceful fallback to aligned mock data
 */
export async function fetchOfficialUrcPlayerData(options: { useLive?: boolean; timeoutMs?: number } = {}): Promise<UrcScraperResponse> {
  const { useLive = true, timeoutMs = 4000 } = options;

  if (useLive) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch('https://www.unitedrugby.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: `query ScrapeUrcPlayers {
            players(limit: 2000) {
              id
              club_id
              season_id
              player_data {
                id
                firstName
                lastName
                knownName
                dob
                birthplace
                countryOfBirth { name }
                height { heightM }
                weight { weightKg }
                normalPosition { name }
              }
            }
          }`
        })
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const rawPlayers = json.data?.players || [];

        if (rawPlayers.length > 500) {
          const clubLookup = new Map<number, UrcScrapedClub>();
          for (const c of OFFICIAL_URC_CLUBS) clubLookup.set(c.id, c);

          const scrapedList: UrcScrapedPlayer[] = [];

          for (let i = 0; i < rawPlayers.length; i++) {
            const raw = rawPlayers[i];
            const pData = raw.player_data || {};
            const club = clubLookup.get(raw.club_id);
            if (!club) continue;

            const name = (pData.knownName || `${pData.firstName || ''} ${pData.lastName || ''}`).trim();
            if (!name) continue;

            const rawPos = pData.normalPosition?.name || '';
            const primaryPos = normalizePosition(rawPos, i % 2 === 1);
            const age = pData.dob ? Math.max(18, Math.min(42, 2026 - new Date(pData.dob).getFullYear())) : 25;
            const heightCm = pData.height?.heightM ? Math.round(pData.height.heightM * 100) : 185;
            const weightKg = pData.weight?.weightKg ? Math.round(pData.weight.weightKg) : 98;
            const nat = pData.countryOfBirth?.name || club.country;

            const ratingInfo = calibratePlayerRating({
              name,
              age,
              primaryPosition: primaryPos,
              baseOverall: 76 + (i % 6)
            });

            const marketValue = Math.round((ratingInfo.overall * ratingInfo.overall * 110) / 1000) * 1000;
            const weeklyWage = Math.round((ratingInfo.overall * ratingInfo.overall * 2.2) / 100) * 100;

            scrapedList.push({
              playerId: raw.id || pData.id || i + 100000,
              firstName: pData.firstName || '',
              lastName: pData.lastName || '',
              knownName: name,
              officialPositionName: rawPos,
              primaryPosition: primaryPos,
              secondaryPositions: [],
              clubId: club.clubId,
              clubName: club.fullName,
              dob: pData.dob,
              age,
              heightCm,
              weightKg,
              nationality: nat,
              overall: ratingInfo.overall,
              potential: ratingInfo.potential,
              isInternational: ratingInfo.isInternational,
              marketValue,
              weeklyWage,
              profileUrl: `https://stats.unitedrugby.com/clubs`
            });
          }

          // Deduplicate and ensure no duplicate Lombard on the Sharks
          const deduplicated = deduplicateScrapedPlayers(scrapedList);

          return {
            success: true,
            sourceUrl: 'https://stats.unitedrugby.com/clubs',
            totalClubs: OFFICIAL_URC_CLUBS.length,
            totalPlayers: deduplicated.length,
            clubs: OFFICIAL_URC_CLUBS,
            players: deduplicated,
            timestamp: new Date().toISOString(),
            isMockSimulation: false,
            notes: 'Successfully scraped from live official URC GraphQL data infrastructure with international caliber calibrations.'
          };
        }
      }
    } catch {
      // Graceful fallback to mock data structure below
    }
  }

  // High-fidelity fallback mock data aligned with official URC Stats website response format
  return getMockUrcScraperResponse();
}

/**
 * Returns mock data structure aligned with official URC Stats website format
 */
export function getMockUrcScraperResponse(): UrcScraperResponse {
  // Generate authentic mock players for all 16 clubs
  const mockPlayers: UrcScrapedPlayer[] = [];

  for (const club of OFFICIAL_URC_CLUBS) {
    const clubStars = Object.entries(INTERNATIONAL_RATINGS).filter(([_, info]) => info.isInternational);
    
    // Add distinct international players and club specialists
    const squadArchetypes = [
      { name: 'Loosehead Prop 1', pos: 'LH_PROP' as RugbyPosition, h: 186, w: 118 },
      { name: 'Hooker 1', pos: 'HOOKER' as RugbyPosition, h: 183, w: 108 },
      { name: 'Tighthead Prop 1', pos: 'TH_PROP' as RugbyPosition, h: 185, w: 124 },
      { name: 'Lock 4', pos: 'LOCK_4' as RugbyPosition, h: 202, w: 119 },
      { name: 'Lock 5', pos: 'LOCK_5' as RugbyPosition, h: 200, w: 117 },
      { name: 'Blindside Flanker 1', pos: 'BLINDSIDE_FLANKER' as RugbyPosition, h: 194, w: 112 },
      { name: 'Openside Flanker 1', pos: 'OPENSIDE_FLANKER' as RugbyPosition, h: 189, w: 105 },
      { name: 'Number 8', pos: 'NUMBER_8' as RugbyPosition, h: 193, w: 114 },
      { name: 'Scrum Half 1', pos: 'SCRUM_HALF' as RugbyPosition, h: 175, w: 84 },
      { name: 'Fly Half 1', pos: 'FLY_HALF' as RugbyPosition, h: 183, w: 91 },
      { name: 'Left Wing 1', pos: 'LEFT_WING' as RugbyPosition, h: 185, w: 94 },
      { name: 'Inside Centre 1', pos: 'INSIDE_CENTRE' as RugbyPosition, h: 188, w: 106 },
      { name: 'Outside Centre 1', pos: 'OUTSIDE_CENTRE' as RugbyPosition, h: 187, w: 98 },
      { name: 'Right Wing 1', pos: 'RIGHT_WING' as RugbyPosition, h: 186, w: 92 },
      { name: 'Fullback 1', pos: 'FULLBACK' as RugbyPosition, h: 188, w: 93 }
    ];

    squadArchetypes.forEach((arch, idx) => {
      const pId = club.id * 100 + idx;
      const playerName = `${club.shortName} Specialist ${idx + 1}`;
      const rating = calibratePlayerRating({ name: playerName, primaryPosition: arch.pos, baseOverall: 79 });

      mockPlayers.push({
        playerId: pId,
        firstName: club.shortName,
        lastName: `Specialist ${idx + 1}`,
        knownName: playerName,
        officialPositionName: arch.pos,
        primaryPosition: arch.pos,
        secondaryPositions: [],
        clubId: club.clubId,
        clubName: club.fullName,
        age: 25 + (idx % 6),
        heightCm: arch.h,
        weightKg: arch.w,
        nationality: club.country,
        overall: rating.overall,
        potential: rating.potential,
        isInternational: rating.isInternational,
        marketValue: 450000,
        weeklyWage: 5500,
        profileUrl: `https://stats.unitedrugby.com/clubs`
      });
    });
  }

  // Add authentic real international stars for clubs with calibrated 91-96 ratings
  const realStars: Array<Omit<UrcScrapedPlayer, 'marketValue' | 'weeklyWage'>> = [
    // Hollywoodbets Sharks
    {
      playerId: 137351,
      firstName: 'Grant',
      lastName: 'Williams',
      knownName: 'Grant Williams',
      officialPositionName: 'scrum-half',
      primaryPosition: 'SCRUM_HALF',
      secondaryPositions: ['RIGHT_WING'],
      clubId: 'sharks_urc',
      clubName: 'Hollywoodbets Sharks',
      dob: '1996-07-22',
      age: 29,
      heightCm: 175,
      weightKg: 77,
      nationality: 'South Africa',
      overall: 93,
      potential: 94,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    {
      playerId: 110023,
      firstName: 'Eben',
      lastName: 'Etzebeth',
      knownName: 'Eben Etzebeth',
      officialPositionName: 'lock',
      primaryPosition: 'LOCK_4',
      secondaryPositions: ['LOCK_5'],
      clubId: 'sharks_urc',
      clubName: 'Hollywoodbets Sharks',
      dob: '1991-10-29',
      age: 34,
      heightCm: 203,
      weightKg: 122,
      nationality: 'South Africa',
      overall: 96,
      potential: 97,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    {
      playerId: 130045,
      firstName: 'Ox',
      lastName: 'Nche',
      knownName: 'Ox Nche',
      officialPositionName: 'prop',
      primaryPosition: 'LH_PROP',
      secondaryPositions: ['TH_PROP'],
      clubId: 'sharks_urc',
      clubName: 'Hollywoodbets Sharks',
      dob: '1995-07-23',
      age: 31,
      heightCm: 173,
      weightKg: 117,
      nationality: 'South Africa',
      overall: 95,
      potential: 96,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    {
      playerId: 115088,
      firstName: 'Bongi',
      lastName: 'Mbonambi',
      knownName: 'Bongi Mbonambi',
      officialPositionName: 'hooker',
      primaryPosition: 'HOOKER',
      secondaryPositions: [],
      clubId: 'sharks_urc',
      clubName: 'Hollywoodbets Sharks',
      dob: '1991-01-07',
      age: 35,
      heightCm: 175,
      weightKg: 108,
      nationality: 'South Africa',
      overall: 93,
      potential: 94,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    {
      playerId: 128900,
      firstName: 'Andre',
      lastName: 'Esterhuizen',
      knownName: 'Andre Esterhuizen',
      officialPositionName: 'centre',
      primaryPosition: 'INSIDE_CENTRE',
      secondaryPositions: ['OUTSIDE_CENTRE'],
      clubId: 'sharks_urc',
      clubName: 'Hollywoodbets Sharks',
      dob: '1994-03-30',
      age: 32,
      heightCm: 193,
      weightKg: 114,
      nationality: 'South Africa',
      overall: 93,
      potential: 94,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    // Ensure single Gianni Lombard on the Sharks with no duplicate
    {
      playerId: 154411,
      firstName: 'Gianni',
      lastName: 'Lombard',
      knownName: 'Gianni Lombard',
      officialPositionName: 'fly-half',
      primaryPosition: 'FLY_HALF',
      secondaryPositions: ['FULLBACK'],
      clubId: 'sharks_urc',
      clubName: 'Hollywoodbets Sharks',
      dob: '1998-01-22',
      age: 28,
      heightCm: 180,
      weightKg: 82,
      nationality: 'South Africa',
      overall: 84,
      potential: 87,
      isInternational: false,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    // Leinster Stars
    {
      playerId: 139900,
      firstName: 'Caelan',
      lastName: 'Doris',
      knownName: 'Caelan Doris',
      officialPositionName: 'number-eight',
      primaryPosition: 'NUMBER_8',
      secondaryPositions: ['BLINDSIDE_FLANKER'],
      clubId: 'leinster',
      clubName: 'Leinster Rugby',
      dob: '1998-04-02',
      age: 28,
      heightCm: 193,
      weightKg: 110,
      nationality: 'Ireland',
      overall: 96,
      potential: 97,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    {
      playerId: 145520,
      firstName: 'Dan',
      lastName: 'Sheehan',
      knownName: 'Dan Sheehan',
      officialPositionName: 'hooker',
      primaryPosition: 'HOOKER',
      secondaryPositions: [],
      clubId: 'leinster',
      clubName: 'Leinster Rugby',
      dob: '1998-09-17',
      age: 27,
      heightCm: 191,
      weightKg: 111,
      nationality: 'Ireland',
      overall: 95,
      potential: 97,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    // DHL Stormers Stars
    {
      playerId: 132440,
      firstName: 'Damian',
      lastName: 'Willemse',
      knownName: 'Damian Willemse',
      officialPositionName: 'fullback',
      primaryPosition: 'FULLBACK',
      secondaryPositions: ['FLY_HALF', 'INSIDE_CENTRE'],
      clubId: 'stormers',
      clubName: 'DHL Stormers',
      dob: '1998-05-07',
      age: 28,
      heightCm: 187,
      weightKg: 93,
      nationality: 'South Africa',
      overall: 95,
      potential: 96,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    {
      playerId: 119840,
      firstName: 'Frans',
      lastName: 'Malherbe',
      knownName: 'Frans Malherbe',
      officialPositionName: 'prop',
      primaryPosition: 'TH_PROP',
      secondaryPositions: ['LH_PROP'],
      clubId: 'stormers',
      clubName: 'DHL Stormers',
      dob: '1991-03-14',
      age: 35,
      heightCm: 190,
      weightKg: 125,
      nationality: 'South Africa',
      overall: 95,
      potential: 96,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    // Glasgow Warriors
    {
      playerId: 141100,
      firstName: 'Sione',
      lastName: 'Tuipulotu',
      knownName: 'Sione Tuipulotu',
      officialPositionName: 'centre',
      primaryPosition: 'INSIDE_CENTRE',
      secondaryPositions: ['OUTSIDE_CENTRE'],
      clubId: 'glasgow',
      clubName: 'Glasgow Warriors',
      dob: '1997-02-12',
      age: 29,
      heightCm: 180,
      weightKg: 104,
      nationality: 'Scotland',
      overall: 94,
      potential: 95,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    // Edinburgh
    {
      playerId: 133200,
      firstName: 'Duhan',
      lastName: 'van der Merwe',
      knownName: 'Duhan van der Merwe',
      officialPositionName: 'wing',
      primaryPosition: 'LEFT_WING',
      secondaryPositions: ['RIGHT_WING'],
      clubId: 'edinburgh',
      clubName: 'Edinburgh Rugby',
      dob: '1995-06-04',
      age: 31,
      heightCm: 193,
      weightKg: 106,
      nationality: 'Scotland',
      overall: 94,
      potential: 95,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    // Connacht
    {
      playerId: 120500,
      firstName: 'Bundee',
      lastName: 'Aki',
      knownName: 'Bundee Aki',
      officialPositionName: 'centre',
      primaryPosition: 'INSIDE_CENTRE',
      secondaryPositions: ['OUTSIDE_CENTRE'],
      clubId: 'connacht',
      clubName: 'Connacht Rugby',
      dob: '1990-04-07',
      age: 36,
      heightCm: 178,
      weightKg: 102,
      nationality: 'Ireland',
      overall: 95,
      potential: 96,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    // Ospreys
    {
      playerId: 147800,
      firstName: 'Jac',
      lastName: 'Morgan',
      knownName: 'Jac Morgan',
      officialPositionName: 'flanker',
      primaryPosition: 'OPENSIDE_FLANKER',
      secondaryPositions: ['BLINDSIDE_FLANKER'],
      clubId: 'ospreys',
      clubName: 'Ospreys',
      dob: '2000-01-21',
      age: 26,
      heightCm: 180,
      weightKg: 102,
      nationality: 'Wales',
      overall: 94,
      potential: 96,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    },
    // Benetton
    {
      playerId: 151200,
      firstName: 'Tommaso',
      lastName: 'Menoncello',
      knownName: 'Tommaso Menoncello',
      officialPositionName: 'centre',
      primaryPosition: 'OUTSIDE_CENTRE',
      secondaryPositions: ['INSIDE_CENTRE', 'LEFT_WING'],
      clubId: 'benetton',
      clubName: 'Benetton Rugby',
      dob: '2002-08-20',
      age: 23,
      heightCm: 187,
      weightKg: 104,
      nationality: 'Italy',
      overall: 94,
      potential: 96,
      isInternational: true,
      profileUrl: 'https://stats.unitedrugby.com/clubs'
    }
  ];

  for (const s of realStars) {
    const marketValue = Math.round((s.overall * s.overall * 110) / 1000) * 1000;
    const weeklyWage = Math.round((s.overall * s.overall * 2.2) / 100) * 100;
    mockPlayers.push({
      ...s,
      marketValue,
      weeklyWage
    });
  }

  const deduplicated = deduplicateScrapedPlayers(mockPlayers);

  return {
    success: true,
    sourceUrl: 'https://stats.unitedrugby.com/clubs',
    totalClubs: OFFICIAL_URC_CLUBS.length,
    totalPlayers: deduplicated.length,
    clubs: OFFICIAL_URC_CLUBS,
    players: deduplicated,
    timestamp: new Date().toISOString(),
    isMockSimulation: true,
    notes: 'Official URC Stats mock data structure simulating all 16 clubs with calibrated international ratings and duplicate-free rosters.'
  };
}
