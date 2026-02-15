export interface Episode {
  seasonNumber: number;
  episodeNumberInSeason: number;
  title: string;
  originalReleaseDate: string | null;
  synopsis: string | null;
}

export interface SeasonProgress {
  appearances: number[];
  wins: number[];
  losses: number[];
  matchupHistory: string[];
  currentPair: [number, number] | null;
  completed: boolean;
}

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  seasons: Record<number, SeasonProgress>;
}
