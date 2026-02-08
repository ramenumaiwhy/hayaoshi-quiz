import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Friend } from '../types';

const normalizeFriendCode = (code: string) => code.replace(/-/g, '').trim().toUpperCase();
const FRIEND_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

type FriendRow = {
  id: string;
  friend_user_id: string;
  users:
    | {
        id: string;
        display_name: string;
        friend_id: string;
      }
    | Array<{
        id: string;
        display_name: string;
        friend_id: string;
      }>
    | null;
};

export const useFriends = (userId: string | null) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('friends')
      .select('id, friend_user_id, users!friends_friend_user_id_fkey(id, display_name, friend_id)')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to fetch friends:', error);
      setIsLoading(false);
      return;
    }

    const mapped = (data as FriendRow[])
      .map((row) => {
        const userInfo = Array.isArray(row.users) ? row.users[0] : row.users;
        if (!userInfo) return null;
        return {
          id: row.id,
          userId: row.friend_user_id,
          displayName: userInfo.display_name ?? '名無し',
          friendId: userInfo.friend_id ?? '',
        };
      })
      .filter((row): row is Friend => row !== null);

    setFriends(mapped);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    void fetchFriends();
  }, [fetchFriends]);

  const addFriend = useCallback(
    async (friendCode: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) {
        return { success: false, error: 'ユーザー情報を取得できない' };
      }

      const normalizedCode = normalizeFriendCode(friendCode);
      if (!FRIEND_CODE_PATTERN.test(normalizedCode)) {
        return { success: false, error: 'フレンドIDの形式が違う' };
      }

      const { data: targetUser, error: targetError } = await supabase
        .from('users')
        .select('id, display_name, friend_id')
        .eq('friend_id', normalizedCode)
        .single();

      if (targetError || !targetUser) {
        return { success: false, error: 'フレンドが見つからない' };
      }

      if (targetUser.id === userId) {
        return { success: false, error: '自分自身は追加できない' };
      }

      const { data: existing } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', userId)
        .eq('friend_user_id', targetUser.id)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, error: '既に登録済みだ' };
      }

      // 双方向に登録（A→BとB→Aの両方）
      const { error: insertError } = await supabase
        .from('friends')
        .insert({ user_id: userId, friend_user_id: targetUser.id });

      if (insertError) {
        console.error('Failed to add friend:', insertError);
        return { success: false, error: '追加に失敗した' };
      }

      // 逆方向も登録（既にあればスキップ）
      const { data: reverseExisting } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', targetUser.id)
        .eq('friend_user_id', userId)
        .limit(1);

      if (!reverseExisting || reverseExisting.length === 0) {
        await supabase
          .from('friends')
          .insert({ user_id: targetUser.id, friend_user_id: userId });
      }

      await fetchFriends();
      return { success: true };
    },
    [userId, fetchFriends]
  );

  const removeFriend = useCallback(
    async (friendUserId: string) => {
      if (!userId) return;

      // 双方向で削除
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', userId)
        .eq('friend_user_id', friendUserId);

      if (error) {
        console.error('Failed to remove friend:', error);
        return;
      }

      // 逆方向も削除
      await supabase
        .from('friends')
        .delete()
        .eq('user_id', friendUserId)
        .eq('friend_user_id', userId);

      setFriends((prev) => prev.filter((friend) => friend.userId !== friendUserId));
    },
    [userId]
  );

  return { friends, isLoading, addFriend, removeFriend };
};
