<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Services\ImageModerationService;
use App\Models\Ad;
use App\Models\User;
use App\Http\Requests\StoreAdRequest;
use App\Http\Requests\UpdateAdRequest;
use App\Http\Resources\AdResource;
use App\Contracts\AdRepositoryInterface;
use App\Jobs\SendFcmNotification;

class AdController extends Controller
{
    protected $adRepository;

    public function __construct(AdRepositoryInterface $adRepository)
    {
        $this->adRepository = $adRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $ads = $this->adRepository->getFilteredAds($request->all());
        return $this->paginatedResponse($ads, 'data_retrieved');
    }

    /**
     * Show a specific ad and increment view counter.
     */
    public function show($id)
    {
        $ad = $this->adRepository->findWithRelations($id, ['user', 'category', 'images', 'comments.user']);

        $ad->increment('views_count');

        return $this->successResponse(new AdResource($ad), 'data_retrieved');
    }

    /**
     * Update ad.
     */
    public function update(UpdateAdRequest $request, $id)
    {
        $ad = $this->adRepository->find($id);
        $originalStatus = $ad->status;
        $data = $request->validated();

        $ad->update($data);

        // If ad was active, notify admins for review (queued, non-blocking)
        if ($originalStatus === 'active') {
            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                SendFcmNotification::dispatch(
                    $admin,
                    'Ad Updated',
                    'An active ad has been updated and may need review',
                    ['ad_id' => $ad->id]
                );
            }
        }

        if ($request->hasFile('images')) {
            // Moderate images before upload
            $moderationService = app(ImageModerationService::class);
            foreach ($request->file('images') as $file) {
                try {
                    $moderationService->analyze($file->getPathname());
                } catch (\Exception $e) {
                    return $this->errorResponse('تم رفض الصورة لأنها تحتوي على محتوى غير لائق', 400);
                }
            }

            foreach ($request->file('images') as $file) {
                $filename = \App\Services\ImageService::uploadAndResize($file, 'ads');
                $ad->images()->create(['image_path' => 'ads/' . $filename]);
            }
        }

        return $this->successResponse(new AdResource($ad->fresh('images')), 'ad_updated');
    }

    /**
     * Soft-delete ad (images preserved for potential restore).
     */
    public function destroy($id)
    {
        $ad = $this->adRepository->find($id);
        $this->authorize('delete', $ad);

        $ad->delete(); // soft delete — images preserved on disk

        return $this->successResponse(null, 'ad_deleted');
    }

    /**
     * Restore a soft-deleted ad.
     */
    public function restore($id)
    {
        $ad = Ad::onlyTrashed()->findOrFail($id);
        $this->authorize('update', $ad);

        $ad->restore();

        return $this->successResponse(new AdResource($ad), 'ad_restored');
    }

    /**
     * Create new ad.
     */
    public function store(StoreAdRequest $request)
    {
        $data = $request->validated();

        $user = Auth::guard('api')->user();

        // Spam protection: limit free users to 3 ads per day
        if (!$user->hasActiveSubscription()) {
            $todayAds = Ad::where('user_id', $user->id)->whereDate('created_at', today())->count();
            if ($todayAds >= 3) {
                return $this->errorResponse('daily_limit_reached', 403);
            }
        }

        $adData = array_merge($data, [
            'user_id' => $user->id,
        ]);

        if ($user->hasActiveSubscription()) {
            $adData['is_featured'] = true;
        } else {
            $adData['status'] = 'pending';
        }

        // set expiry 30 days from now
        $adData['expires_at'] = now()->addDays(30);

        $ad = $this->adRepository->create($adData);

        // handle images
        if ($request->hasFile('images')) {
            // Moderate images before upload
            $moderationService = app(ImageModerationService::class);
            foreach ($request->file('images') as $file) {
                try {
                    $moderationService->analyze($file->getPathname());
                } catch (\Exception $e) {
                    // Rollback: delete the ad that was just created
                    $ad->forceDelete();
                    return $this->errorResponse('تم رفض الصورة لأنها تحتوي على محتوى غير لائق', 400);
                }
            }

            foreach ($request->file('images') as $file) {
                $filename = \App\Services\ImageService::uploadAndResize($file, 'ads');
                $ad->images()->create(['image_path' => 'ads/' . $filename]);
            }
        }

        return $this->successResponse(new AdResource($ad->load('images')), 'ad_created', 201);
    }

    /**
     * Renew an expired or active ad by extending expiry and reactivating.
     */
    public function renew($id)
    {
        $ad = $this->adRepository->find($id);
        $this->authorize('update', $ad);

        $ad = $this->adRepository->renew($id);

        return $this->successResponse(new AdResource($ad), 'ad_renewed');
    }
}
