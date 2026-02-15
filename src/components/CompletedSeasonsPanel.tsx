import type { RankingEntry } from '../lib/ranking';

interface CompletedSeasonsPanelProps {
  completedSeasons: number[];
  getRanking: (seasonNumber: number) => RankingEntry[];
  onResetSeason: (seasonNumber: number) => void;
}

const CompletedSeasonsPanel = ({
  completedSeasons,
  getRanking,
  onResetSeason
}: CompletedSeasonsPanelProps): JSX.Element => {
  return (
    <article className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
      <h2 className="font-display text-xl font-semibold">Completed Seasons</h2>
      {completedSeasons.length === 0 ? (
        <p className="mt-2 text-sm text-black/70">No completed seasons yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {completedSeasons.map((seasonNumber) => {
            const ranking = getRanking(seasonNumber);
            const topThree = ranking.slice(0, 3);

            return (
              <details key={seasonNumber} className="rounded-xl border border-black/10 bg-white p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">Season {seasonNumber}</p>
                      <p className="text-sm text-black/70">
                        Top 3: {topThree.map((entry) => entry.episode.title).join(' • ')}
                      </p>
                    </div>
                    <span className="rounded-full bg-moss/15 px-3 py-1 text-xs font-semibold text-moss">
                      Complete
                    </span>
                  </div>
                </summary>
                <ol className="mt-4 space-y-2 text-sm">
                  {ranking.map((entry, index) => (
                    <li
                      key={entry.episode.episodeNumberInSeason}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-parchment px-3 py-2"
                    >
                      <div className="min-w-0">
                        <span>
                          {index + 1}. {entry.episode.title}
                        </span>
                        {entry.episode.synopsis ? (
                          <p className="mt-1 text-xs text-black/65">{entry.episode.synopsis}</p>
                        ) : null}
                      </div>
                      <span className="text-black/70">
                        {entry.wins}-{entry.losses} (score {entry.score})
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="rounded-lg border border-black/20 px-3 py-1.5 text-sm font-medium hover:bg-black/5"
                    onClick={() => onResetSeason(seasonNumber)}
                  >
                    Reset Season
                  </button>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </article>
  );
};

export default CompletedSeasonsPanel;
