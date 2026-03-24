<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BlockService;

class RatingController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        if ($request->user_id == auth()->id()) {
            return $this->errorResponse('cannot_rate_self', 400);
        }

        // Block check: prevent rating blocked users
        if (BlockService::areUsersBlocked(auth()->id(), $request->user_id)) {
            return $this->errorResponse('blocked_interaction', 403);
        }

        $rating = \App\Models\Rating::updateOrCreate(
            ['user_id' => $request->user_id, 'rater_id' => auth()->id()],
            ['rating' => $request->rating, 'comment' => $request->comment]
        );

        // Recalculate average
        $avg = \App\Models\Rating::where('user_id', $request->user_id)->avg('rating');

        return $this->successResponse([
            'rating' => $rating,
            'average' => round($avg, 2),
        ], 'rating_submitted');
    }
}
