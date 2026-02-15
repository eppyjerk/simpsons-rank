import { TARGET_APPEARANCES } from '../constants';
import type { Episode, Session } from '../types';

interface UnrankedSeasonsPanelProps {
  unrankedSeasons: number[];
  activeSession: Session;
  seasons: Record<number, Episode[]>;
  isOpen: boolean;
  onToggleOpen: () => void;
  onStartSeason: (seasonNumber: number) => void;
  onResetSeason: (seasonNumber: number) => void;
}

const UnrankedSeasonsPanel = ({
  unrankedSeasons,
  activeSession,
  seasons,
  isOpen,
  onToggleOpen,
  onStartSeason,
  onResetSeason
}: UnrankedSeasonsPanelProps): JSX.Element => {
  return (
    <article className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Seasons Not Yet Ranked</h2>
        <button
          type="button"
          className="rounded-lg border border-black/20 px-3 py-1.5 text-sm font-medium hover:bg-black/5"
          onClick={onToggleOpen}
        >
          {isOpen ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {unrankedSeasons.map((seasonNumber) => {
            const progress = activeSession.seasons[seasonNumber];
            const episodes = seasons[seasonNumber] ?? [];
            const hasProgress =
              progress !== undefined && progress.appearances.some((appearanceCount) => appearanceCount > 0);
            const coverage = progress
              ? Math.min(
                  100,
                  Math.round(
                    (progress.appearances.reduce((sum, count) => sum + Math.min(count, TARGET_APPEARANCES), 0) /
                      (episodes.length * TARGET_APPEARANCES)) *
                      100
                  )
                )
              : 0;

            return (
              <div key={seasonNumber} className="rounded-xl border border-black/10 bg-white p-4">
                <p className="font-semibold">Season {seasonNumber}</p>
                <p className="text-sm text-black/70">Episodes: {episodes.length}</p>
                <p className="mt-1 text-xs text-black/60">Progress: {coverage}%</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white"
                    onClick={() => onStartSeason(seasonNumber)}
                  >
                    {hasProgress ? 'Continue' : 'Start Season'}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-black/20 px-3 py-1.5 text-sm font-medium"
                    onClick={() => onResetSeason(seasonNumber)}
                  >
                    Reset Season
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-black/70">
          {unrankedSeasons.length} seasons hidden. Click Expand to open the list.
        </p>
      )}
    </article>
  );
};

export default UnrankedSeasonsPanel;
