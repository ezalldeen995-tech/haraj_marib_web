<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BlockController extends Controller
{
    public function toggleBlock(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $userId = auth()->id();
        $target = $request->user_id;

        if ($userId == $target) {
            return $this->errorResponse('cannot_block_self', 400);
        }

        $block = \App\Models\BlockedUser::where('user_id', $userId)
            ->where('blocked_user_id', $target)
            ->first();

        if ($block) {
            $block->delete();
            return $this->successResponse(['blocked' => false], 'user_unblocked');
        }

        \App\Models\BlockedUser::create([
            'user_id' => $userId,
            'blocked_user_id' => $target,
        ]);

        return $this->successResponse(['blocked' => true], 'user_blocked');
    }
}
