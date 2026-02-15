import { TARGET_APPEARANCES } from '../constants';
import { getDisplayDate } from '../lib/ranking';
import type { Episode, SeasonProgress } from '../types';

interface CurrentMatchupPanelProps {
  focusedSeason: number | null;
  focusedSeasonProgress: SeasonProgress | null;
  focusedSeasonEpisodes: Episode[];
  onVote: (pickedSide: 'left' | 'right') => void;
}

const CurrentMatchupPanel = ({
  focusedSeason,
  focusedSeasonProgress,
  focusedSeasonEpisodes,
  onVote
}: CurrentMatchupPanelProps): JSX.Element => {
  const focusedPair = focusedSeasonProgress?.currentPair;
  const progressPercent =
    focusedSeason !== null && focusedSeasonProgress && focusedSeasonEpisodes.length > 0
      ? Math.min(
          100,
          Math.round(
            (focusedSeasonProgress.appearances.reduce(
              (sum, count) => sum + Math.min(count, TARGET_APPEARANCES),
              0
            ) /
              (focusedSeasonEpisodes.length * TARGET_APPEARANCES)) *
              100
          )
        )
      : null;

  return (
    <article className="rounded-2xl border border-black/10 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Current Matchup</h2>
        {progressPercent !== null ? (
          <span className="rounded-full border border-black/15 bg-white/70 px-3 py-1 text-xs font-semibold text-black/75">
            Progress {progressPercent}%
          </span>
        ) : null}
      </div>
      {focusedSeason === null ? (
        <p className="mt-2 text-sm text-black/70">Choose a season in the list above and click Start Season.</p>
      ) : focusedSeasonProgress?.completed ? (
        <div className="mt-3 rounded-xl bg-moss/10 p-4 text-sm">
          Season {focusedSeason} is complete. Use Reset Season if you want to run it again.
        </div>
      ) : focusedPair ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(['left', 'right'] as const).map((side, sideIndex) => {
            const episodeIndex = sideIndex === 0 ? focusedPair[0] : focusedPair[1];
            const episode = focusedSeasonEpisodes[episodeIndex];

            return (
              <button
                key={`${side}-${episode.episodeNumberInSeason}`}
                type="button"
                className="rounded-xl border border-black/10 bg-parchment p-4 text-left transition hover:-translate-y-0.5 hover:border-accent"
                onClick={() => onVote(side)}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  {side === 'left' ? 'Left Choice' : 'Right Choice'}
                </p>
                <p className="mt-1 text-lg font-semibold">{episode.title}</p>
                <p className="mt-1 text-sm text-black/70">
                  S{episode.seasonNumber}E{episode.episodeNumberInSeason} • {getDisplayDate(episode.originalReleaseDate)}
                </p>
                {episode.synopsis ? (
                  <div className="mt-3 rounded-lg border border-black/10 bg-white/60 p-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-black/55">Synopsis</p>
                    <p className="mt-1 text-sm text-black/75">{episode.synopsis}</p>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-sm text-black/70">No matchup available yet. Click Start Season again to generate one.</p>
      )}

      {focusedSeason && focusedSeasonProgress && !focusedSeasonProgress.completed ? (
        <p className="mt-3 text-xs text-black/60">
          Each episode must appear in at least {TARGET_APPEARANCES} matchups. Repeated pairings are blocked.
        </p>
      ) : null}
    </article>
  );
};

export default CurrentMatchupPanel;
