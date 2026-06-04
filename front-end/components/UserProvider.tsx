'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '@/lib/api';
import { getCurrentUserId, setCurrentUserId } from '@/lib/user';
import type { User } from '@/types/notification.types';

interface UserContextValue {
  users: User[];
  currentUser: User | null;
  setCurrentUser: (id: string) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  users: [],
  currentUser: null,
  setCurrentUser: () => {},
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listUsers()
      .then((list) => {
        setUsers(list);
        const saved = getCurrentUserId();
        const initial =
          (saved && list.find((u) => u.id === saved)?.id) ?? list[0]?.id ?? null;
        if (initial) {
          setCurrentId(initial);
          setCurrentUserId(initial);
        }
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const setCurrentUser = useCallback((id: string) => {
    setCurrentId(id);
    setCurrentUserId(id);
  }, []);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentId) ?? null,
    [users, currentId],
  );

  const value = useMemo(
    () => ({ users, currentUser, setCurrentUser, loading }),
    [users, currentUser, setCurrentUser, loading],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
