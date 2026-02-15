import type { Session } from '../types';

interface SessionSidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onCreateSession: () => void;
  onSelectSession: (sessionId: string) => void;
}

const SessionSidebar = ({
  sessions,
  activeSessionId,
  onCreateSession,
  onSelectSession
}: SessionSidebarProps): JSX.Element => {
  return (
    <aside className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm backdrop-blur-sm md:p-6">
      <h1 className="font-display text-2xl font-bold">Simpsons Rank</h1>
      <p className="mt-1 text-sm text-black/70">Local-only ranking sessions for your episode matchups.</p>

      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-accent px-4 py-2 font-semibold text-white transition hover:brightness-95"
        onClick={onCreateSession}
      >
        Create Session
      </button>

      <div className="mt-6 space-y-2">
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/20 p-3 text-sm text-black/70">
            Create a session to begin ranking.
          </p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                session.id === activeSessionId
                  ? 'border-moss bg-moss/10'
                  : 'border-black/10 bg-white hover:border-black/30'
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <p className="font-semibold">{session.name}</p>
              <p className="text-xs text-black/60">
                {new Date(session.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};

export default SessionSidebar;
