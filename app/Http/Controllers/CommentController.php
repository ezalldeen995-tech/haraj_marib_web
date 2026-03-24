<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BlockService;

class CommentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'ad_id' => 'required|exists:ads,id',
            'content' => 'required|string|max:1000',
        ]);

        // Block check: prevent commenting on blocked user's ads
        $ad = \App\Models\Ad::findOrFail($request->ad_id);
        if (BlockService::areUsersBlocked(auth()->id(), $ad->user_id)) {
            return $this->errorResponse('blocked_interaction', 403);
        }

        $comment = \App\Models\Comment::create([
            'ad_id' => $request->ad_id,
            'user_id' => auth()->id(),
            'content' => $request->content,
        ]);

        return $this->successResponse($comment, 'comment_created', 201);
    }

    public function destroy($id)
    {
        $comment = \App\Models\Comment::findOrFail($id);
        if ($comment->user_id !== auth()->id()) {
            return $this->errorResponse('unauthorized', 403);
        }
        $comment->delete();

        return $this->successResponse(null, 'comment_deleted');
    }
}
