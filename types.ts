export interface Team {
  id: string;
  name: string;
  strength: number; // 1-100
  primaryColor: string;
  groupId?: string; // For cup group stages
}

export type MatchStage = 'LEAGUE' | 'GROUP_STAGE' | 'R32' | 'R16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL' | '3RD_PLACE';

export interface Match {
  id: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  commentary?: string;
  stage: MatchStage; 
  groupId?: string; // If part of a group stage
  // New fields for Cup
  leg?: 1 | 2; // 1st or 2nd leg
  relatedMatchId?: string; // ID of the other leg
  penaltyWinnerId?: string; // ID of team who won penalties
  aggregateHome?: number; // Snapshot for display
  aggregateAway?: number;
}

export interface TableRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L' | '-')[];
}

export enum ViewState {
  HOME = 'HOME', // New Home/Load screen
  SETUP = 'SETUP',
  TABLE = 'TABLE',
  FIXTURES = 'FIXTURES',
  NEWS = 'NEWS'
}

export type CompetitionType = 'LEAGUE' | 'CUP';
export type CupFormat = 'KNOCKOUT' | 'GROUP_KNOCKOUT';

export interface CompetitionConfig {
  id: string; // Unique ID for saving
  name: string;
  type: CompetitionType;
  teamCount: number;
  // League Specific
  doubleRound: boolean;
  qualificationSpots: number;
  relegationSpots: number;
  // Cup Specific
  cupFormat: CupFormat;
  groupCount: number; // e.g., 4 groups
  advancingPerGroup: number; // e.g., 2 teams per group
  doubleRoundPlayoffs: boolean; // Home & Away for KO stages (except Final)
}

export interface NewsItem {
  id: string;
  round: number;
  headline: string;
  content: string;
  timestamp: string; // Changed to string for JSON serialization
}

export interface SaveData {
  config: CompetitionConfig;
  teams: Team[];
  matches: Match[];
  news: NewsItem[];
  currentRound: number;
  timestamp: number;
}