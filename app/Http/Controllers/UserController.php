<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{

    /**
     * Return profile with active ads count and rating average.
     */
    public function profile()
    {
        $user = Auth::guard('api')->user();
        $activeAds = $user->ads()->where('status', 'active')->count();
        $ratingAvg = $user->ratingsReceived()->avg('rating') ?? 0;

        return $this->successResponse([
            'user' => new UserResource($user),
            'active_ads_count' => $activeAds,
            'rating_avg' => round((float) $ratingAvg, 2),
        ], 'data_retrieved');
    }

    /**
     * Update basic profile fields.
     */
    public function updateProfile(UpdateUserRequest $request)
    {
        $user = Auth::guard('api')->user();

        $data = $request->validated();

        $user->update($data);

        return $this->successResponse(new UserResource($user->fresh()), 'profile_updated');
    }

    /**
     * Change avatar image.
     */
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $user = Auth::guard('api')->user();

        $filename = \App\Services\ImageService::uploadAndResize($request->file('avatar'), 'avatars');

        if ($user->avatar && $user->avatar !== 'default.png') {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->avatar = 'avatars/' . $filename;
        $user->save();

        return $this->successResponse(['avatar' => Storage::url($user->avatar)], 'avatar_updated');
    }

    /**
     * Update device token for push notifications.
     */
    public function updateDeviceToken(Request $request)
    {
        $data = $request->validate([
            'device_token' => ['required', 'string'],
        ]);

        $user = Auth::guard('api')->user();
        $user->device_token = $data['device_token'];
        $user->save();

        return $this->successResponse(null, 'device_token_updated');
    }

    /**
     * Delete or soft delete the authenticated user and related data.
     */
    public function deleteAccount()
    {
        $user = Auth::guard('api')->user();

        $user->delete();

        return $this->successResponse(null, 'account_deleted');
    }
}
