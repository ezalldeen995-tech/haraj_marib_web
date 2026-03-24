<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\AdResource;

class FavoriteController extends Controller
{
    public function toggleFavorite(Request $request)
    {
        $request->validate([
            'ad_id' => 'required|exists:ads,id',
        ]);

        $userId = auth()->id();
        $favorite = \App\Models\Favorite::where('user_id', $userId)
            ->where('ad_id', $request->ad_id)
            ->first();

        if ($favorite) {
            $favorite->delete();
            return $this->successResponse(['favorited' => false], 'favorite_removed');
        }

        \App\Models\Favorite::create([
            'user_id' => $userId,
            'ad_id' => $request->ad_id,
        ]);

        return $this->successResponse(['favorited' => true], 'favorite_added');
    }

    public function myFavorites(Request $request)
    {
        $userId = auth()->id();

        $ads = \App\Models\Ad::whereHas('favorites', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })->paginate(10);

        return $this->paginatedResponse($ads, 'data_retrieved');
    }
}
