<?php

namespace App\Services;

use App\Models\BlockedUser;

class BlockService
{
    /**
     * Check if a mutual block exists between two users.
     * Returns true if either user has blocked the other.
     */
    public static function areUsersBlocked(int $userId1, int $userId2): bool
    {
        return BlockedUser::where(function ($q) use ($userId1, $userId2) {
            $q->where('user_id', $userId1)->where('blocked_user_id', $userId2);
        })->orWhere(function ($q) use ($userId1, $userId2) {
            $q->where('user_id', $userId2)->where('blocked_user_id', $userId1);
        })->exists();
    }
}
