<?php

namespace App\Repositories;

use App\Contracts\AdRepositoryInterface;
use App\Models\Ad;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentAdRepository implements AdRepositoryInterface
{
    public function create(array $data): Ad
    {
        return Ad::create($data);
    }

    public function find($id): Ad
    {
        return Ad::findOrFail($id);
    }

    public function findWithRelations($id, array $relations): Ad
    {
        return Ad::with($relations)->findOrFail($id);
    }

    public function getFilteredAds(array $filters): LengthAwarePaginator
    {
        $userId = auth('api')->id();

        $query = Ad::query()
            ->with([
                'user' => function ($q) {
                    $q->select('id', 'name', 'phone', 'avatar', 'subscription_ends_at')
                      ->withAvg('ratingsReceived', 'rating');
                },
                'category',
                'images' => function ($q) {
                    $q->select('id','ad_id','image_path');
                },
            ]);

        // Pre-compute is_favorited as a single subquery (eliminates N+1)
        if ($userId) {
            $query->withExists(['favorites as is_favorited' => function ($q) use ($userId) {
                $q->where('user_id', $userId);
            }]);
        }

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        if (isset($filters['address_text'])) {
            $query->where('address_text', 'like', "%{$filters['address_text']}%");
        }

        // Filter by user
        if (isset($filters['my_ads']) && $filters['my_ads'] == 1 && $userId) {
            $query->where('user_id', $userId);
        } elseif (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        // Status filter
        if (isset($filters['my_ads']) && $filters['my_ads'] == 1) {
            // For "My Ads", default to showing all statuses (active, pending, rejected)
            // unless a specific status filter is provided.
            if (isset($filters['status'])) {
                $query->where('status', $filters['status']);
            }
        } else {
            // Default behavior for public listing/other users: only show 'active' ads
            $status = $filters['status'] ?? 'active';
            $query->where('status', $status);
        }

        $sort = $filters['sort'] ?? 'created_at';
        
        // Map frontend sort values to database columns
        $sortMap = [
            'latest' => ['created_at', 'desc'],
            'oldest' => ['created_at', 'asc'],
            'created_at' => ['created_at', 'desc'],
            'price' => ['price', 'desc'],
            'price_asc' => ['price', 'asc'],
            'price_desc' => ['price', 'desc'],
        ];

        if (isset($sortMap[$sort])) {
            $query->orderBy($sortMap[$sort][0], $sortMap[$sort][1]);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = $filters['per_page'] ?? 10;
        return $query->paginate((int) $perPage);
    }

    public function update($id, array $data): bool
    {
        $ad = $this->find($id);
        return $ad->update($data);
    }

    public function delete($id): bool
    {
        $ad = Ad::with('images')->findOrFail($id);
        // Note: Authorization should be handled in controller
        $ad->delete();
        return true;
    }

    public function renew($id): Ad
    {
        $ad = $this->find($id);
        $ad->expires_at = now()->addDays(30);
        $ad->status = 'active';
        $ad->save();
        return $ad;
    }
}