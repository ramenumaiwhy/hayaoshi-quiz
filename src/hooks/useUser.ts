import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

const STORAGE_KEY = 'hayaoshi-user-id';
const FRIEND_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FRIEND_ID_LENGTH = 6;
const FRIEND_ID_RETRY_LIMIT = 5;

const generateFriendId = () => {
  let result = '';
  for (let i = 0; i < FRIEND_ID_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * FRIEND_ID_CHARS.length);
    result += FRIEND_ID_CHARS[index];
  }
  return result;
};

type DbUserRow = {
  id: string;
  friend_id: string;
  display_name: string;
};

const mapRowToUser = (row: DbUserRow): User => ({
  id: row.id,
  friendId: row.friend_id,
  displayName: row.display_name,
});

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUser = useCallback(async (): Promise<User | null> => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) return null;

    const { data, error } = await supabase
      .from('users')
      .select('id, friend_id, display_name')
      .eq('id', storedId)
      .single();

    if (error || !data) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return mapRowToUser(data as DbUserRow);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const loadedUser = await getUser();
      if (!isMounted) return;
      setUser(loadedUser);
      setIsLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [getUser]);

  const createUser = useCallback(
    async (displayName: string): Promise<User> => {
      const name = displayName.trim();
      if (!name) {
        throw new Error('名前を入力してね');
      }

      for (let attempt = 0; attempt < FRIEND_ID_RETRY_LIMIT; attempt += 1) {
        const friendId = generateFriendId();
        const { data, error } = await supabase
          .from('users')
          .insert({ friend_id: friendId, display_name: name })
          .select('id, friend_id, display_name')
          .single();

        if (!error && data) {
          const newUser = mapRowToUser(data as DbUserRow);
          localStorage.setItem(STORAGE_KEY, newUser.id);
          setUser(newUser);
          return newUser;
        }

        if (error && error.code !== '23505') {
          throw error;
        }
      }

      throw new Error('フレンドIDの生成に失敗した');
    },
    []
  );

  return { user, isLoading, createUser };
};
