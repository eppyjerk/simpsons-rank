import { TARGET_APPEARANCES } from '../constants';
import type { Episode, SeasonProgress } from '../types';

export interface RankingEntry {
  episode: Episode;
  wins: number;
  losses: number;
  appearances: number;
  score: number;
}

export const pairKey = (a: number, b: number): string => (a < b ? `${a}-${b}` : `${b}-${a}`);

export const createSeasonProgress = (episodeCount: number): SeasonProgress => ({
  appearances: Array.from({ length: episodeCount }, () => 0),
  wins: Array.from({ length: episodeCount }, () => 0),
  losses: Array.from({ length: episodeCount }, () => 0),
  matchupHistory: [],
  currentPair: null,
  completed: false
});

export const isSeasonComplete = (progress: SeasonProgress): boolean =>
  progress.appearances.every((appearanceCount) => appearanceCount >= TARGET_APPEARANCES);

export const pickNextPair = (progress: SeasonProgress): [number, number] | null => {
  const episodeCount = progress.appearances.length;
  const usedPairs = new Set(progress.matchupHistory);
  const pairs: Array<[number, number]> = [];

  for (let firstIndex = 0; firstIndex < episodeCount; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < episodeCount; secondIndex += 1) {
      const key = pairKey(firstIndex, secondIndex);
      if (!usedPairs.has(key)) {
        pairs.push([firstIndex, secondIndex]);
      }
    }
  }

  if (pairs.length === 0) {
    return null;
  }

  const underTarget = new Set(
    progress.appearances
      .map((count, episodeIndex) => ({ count, episodeIndex }))
      .filter((entry) => entry.count < TARGET_APPEARANCES)
      .map((entry) => entry.episodeIndex)
  );

  const candidatePairs = pairs.filter(([firstIndex, secondIndex]) =>
    underTarget.has(firstIndex) || underTarget.has(secondIndex)
  );
  const pool = candidatePairs.length > 0 ? candidatePairs : pairs;

  return pool[Math.floor(Math.random() * pool.length)];
};

export const getDisplayDate = (value: string | null): string => {
  if (!value) {
    return 'Unknown';
  }

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getSeasonRanking = (
  episodes: Episode[],
  progress: SeasonProgress | undefined
): RankingEntry[] => {
  if (!progress) {
    return [];
  }

  return episodes
    .map((episode, index) => ({
      episode,
      wins: progress.wins[index] ?? 0,
      losses: progress.losses[index] ?? 0,
      appearances: progress.appearances[index] ?? 0,
      score: (progress.wins[index] ?? 0) - (progress.losses[index] ?? 0)
    }))
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      if (second.wins !== first.wins) {
        return second.wins - first.wins;
      }

      if (first.losses !== second.losses) {
        return first.losses - second.losses;
      }

      return first.episode.episodeNumberInSeason - second.episode.episodeNumberInSeason;
    });
};
