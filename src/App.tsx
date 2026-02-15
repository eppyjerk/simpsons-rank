import { useEffect, useMemo, useRef, useState } from 'react';
import CompletedSeasonsPanel from './components/CompletedSeasonsPanel';
import CurrentMatchupPanel from './components/CurrentMatchupPanel';
import SessionSidebar from './components/SessionSidebar';
import UnrankedSeasonsPanel from './components/UnrankedSeasonsPanel';
import { SEASON_NUMBERS } from './constants';
import { useSessions } from './hooks/useSessions';
import {
  createSeasonProgress,
  getSeasonRanking,
  isSeasonComplete,
  pairKey,
  pickNextPair
} from './lib/ranking';
import type { Episode, SeasonProgress, Session } from './types';

const App = (): JSX.Element => {
  const [seasons, setSeasons] = useState<Record<number, Episode[]>>({});
  const [focusedSeason, setFocusedSeason] = useState<number | null>(null);
  const [isUnrankedSeasonsOpen, setIsUnrankedSeasonsOpen] = useState(true);
  const previousCompletedCountRef = useRef(0);

  const { sessions, activeSessionId, activeSession, createSession, selectSession, updateActiveSession } =
    useSessions();

  useEffect(() => {
    const loadSeasons = async (): Promise<void> => {
      const loadedEntries = await Promise.all(
        SEASON_NUMBERS.map(async (seasonNumber) => {
          const response = await fetch(`/data/season_${seasonNumber}.json`);
          if (!response.ok) {
            throw new Error(`Failed to load season ${seasonNumber}`);
          }

          const seasonEpisodes = (await response.json()) as Episode[];
          return [seasonNumber, seasonEpisodes] as const;
        })
      );

      setSeasons(Object.fromEntries(loadedEntries));
    };

    void loadSeasons();
  }, []);

  const ensureSeasonProgress = (session: Session, seasonNumber: number): SeasonProgress => {
    const existing = session.seasons[seasonNumber];
    if (existing) {
      return existing;
    }

    const episodes = seasons[seasonNumber] ?? [];
    return createSeasonProgress(episodes.length);
  };

  const onCreateSession = (): void => {
    createSession();
    setFocusedSeason(null);
    setIsUnrankedSeasonsOpen(true);
  };

  const onSelectSession = (sessionId: string): void => {
    selectSession(sessionId);
    setFocusedSeason(null);
    setIsUnrankedSeasonsOpen(true);
  };

  const startSeason = (seasonNumber: number): void => {
    if (!activeSession || !seasons[seasonNumber]) {
      return;
    }

    setIsUnrankedSeasonsOpen(false);
    setFocusedSeason(seasonNumber);
    updateActiveSession((session) => {
      const progress = ensureSeasonProgress(session, seasonNumber);
      const completed = isSeasonComplete(progress);
      const nextPair = completed ? null : progress.currentPair ?? pickNextPair(progress);

      return {
        ...session,
        seasons: {
          ...session.seasons,
          [seasonNumber]: {
            ...progress,
            completed,
            currentPair: nextPair
          }
        }
      };
    });
  };

  const resetSeason = (seasonNumber: number): void => {
    if (!activeSession || !seasons[seasonNumber]) {
      return;
    }

    updateActiveSession((session) => {
      const nextSeasons = { ...session.seasons };
      delete nextSeasons[seasonNumber];

      return {
        ...session,
        seasons: nextSeasons
      };
    });
  };

  const voteForEpisode = (pickedSide: 'left' | 'right'): void => {
    if (!activeSession || !focusedSeason) {
      return;
    }

    const episodes = seasons[focusedSeason] ?? [];
    if (episodes.length < 2) {
      return;
    }

    updateActiveSession((session) => {
      const progress = ensureSeasonProgress(session, focusedSeason);
      const currentPair = progress.currentPair ?? pickNextPair(progress);

      if (!currentPair) {
        return {
          ...session,
          seasons: {
            ...session.seasons,
            [focusedSeason]: {
              ...progress,
              completed: true,
              currentPair: null
            }
          }
        };
      }

      const [leftIndex, rightIndex] = currentPair;
      const winnerIndex = pickedSide === 'left' ? leftIndex : rightIndex;
      const loserIndex = pickedSide === 'left' ? rightIndex : leftIndex;

      const nextProgress: SeasonProgress = {
        ...progress,
        appearances: [...progress.appearances],
        wins: [...progress.wins],
        losses: [...progress.losses],
        matchupHistory: [...progress.matchupHistory, pairKey(leftIndex, rightIndex)],
        currentPair: null,
        completed: false
      };

      nextProgress.appearances[leftIndex] += 1;
      nextProgress.appearances[rightIndex] += 1;
      nextProgress.wins[winnerIndex] += 1;
      nextProgress.losses[loserIndex] += 1;

      nextProgress.completed = isSeasonComplete(nextProgress);
      nextProgress.currentPair = nextProgress.completed ? null : pickNextPair(nextProgress);

      if (!nextProgress.currentPair && !nextProgress.completed) {
        nextProgress.completed = true;
      }

      return {
        ...session,
        seasons: {
          ...session.seasons,
          [focusedSeason]: nextProgress
        }
      };
    });
  };

  const getRanking = (seasonNumber: number) => {
    if (!activeSession) {
      return [];
    }

    return getSeasonRanking(seasons[seasonNumber] ?? [], activeSession.seasons[seasonNumber]);
  };

  const completedSeasons = useMemo(
    () =>
      activeSession === null
        ? []
        : SEASON_NUMBERS.filter((seasonNumber) => activeSession.seasons[seasonNumber]?.completed).sort(
            (a, b) => a - b
          ),
    [activeSession]
  );

  const unrankedSeasons = useMemo(
    () =>
      activeSession === null
        ? [...SEASON_NUMBERS]
        : SEASON_NUMBERS.filter((seasonNumber) => !activeSession.seasons[seasonNumber]?.completed).sort(
            (a, b) => a - b
          ),
    [activeSession]
  );

  const focusedSeasonProgress =
    activeSession && focusedSeason ? activeSession.seasons[focusedSeason] ?? null : null;
  const focusedSeasonEpisodes = focusedSeason ? seasons[focusedSeason] ?? [] : [];

  useEffect(() => {
    if (completedSeasons.length > previousCompletedCountRef.current) {
      setIsUnrankedSeasonsOpen(true);
    }
    previousCompletedCountRef.current = completedSeasons.length;
  }, [completedSeasons.length]);

  return (
    <main className="min-h-screen p-4 font-body text-ink md:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onCreateSession={onCreateSession}
          onSelectSession={onSelectSession}
        />

        <section className="space-y-6">
          {activeSession === null ? (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white/60 p-8 text-center">
              <p className="text-lg font-semibold">No active session selected</p>
              <p className="mt-1 text-sm text-black/70">
                Create a session from the left panel to start comparing episodes.
              </p>
            </div>
          ) : (
            <>
              <CompletedSeasonsPanel
                completedSeasons={completedSeasons}
                getRanking={getRanking}
                onResetSeason={resetSeason}
              />
              <UnrankedSeasonsPanel
                unrankedSeasons={unrankedSeasons}
                activeSession={activeSession}
                seasons={seasons}
                isOpen={isUnrankedSeasonsOpen}
                onToggleOpen={() => setIsUnrankedSeasonsOpen((current) => !current)}
                onStartSeason={startSeason}
                onResetSeason={resetSeason}
              />
              <CurrentMatchupPanel
                focusedSeason={focusedSeason}
                focusedSeasonProgress={focusedSeasonProgress}
                focusedSeasonEpisodes={focusedSeasonEpisodes}
                onVote={voteForEpisode}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
