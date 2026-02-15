import { useEffect, useMemo, useState } from 'react';
import { STORAGE_KEY } from '../constants';
import type { Session } from '../types';

const safeRandomId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

interface StoredSessions {
  sessions: Session[];
  activeSessionId: string | null;
}

interface UseSessionsResult {
  sessions: Session[];
  activeSessionId: string | null;
  activeSession: Session | null;
  createSession: () => void;
  selectSession: (sessionId: string | null) => void;
  updateActiveSession: (mutate: (session: Session) => Session) => void;
}

export const useSessions = (): UseSessionsResult => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(storedValue) as StoredSessions;
      setSessions(parsed.sessions ?? []);
      setActiveSessionId(parsed.activeSessionId ?? null);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sessions,
        activeSessionId
      } satisfies StoredSessions)
    );
  }, [sessions, activeSessionId, isHydrated]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  const createSession = (): void => {
    const newSession: Session = {
      id: safeRandomId(),
      name: `Session ${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      seasons: {}
    };

    setSessions((current) => [newSession, ...current]);
    setActiveSessionId(newSession.id);
  };

  const selectSession = (sessionId: string | null): void => {
    setActiveSessionId(sessionId);
  };

  const updateActiveSession = (mutate: (session: Session) => Session): void => {
    if (!activeSession) {
      return;
    }

    setSessions((current) =>
      current.map((session) => (session.id === activeSession.id ? mutate(session) : session))
    );
  };

  return {
    sessions,
    activeSessionId,
    activeSession,
    createSession,
    selectSession,
    updateActiveSession
  };
};
