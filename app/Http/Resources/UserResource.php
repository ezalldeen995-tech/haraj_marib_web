<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->when($this->phone, function () use ($request) {
                // Show full phone number if the user is viewing their own profile
                if ($request->user() && $request->user()->id === $this->id) {
                    return $this->phone;
                }

                // Partially hide phone: show first 3 and last 3 digits
                $phone = $this->phone;
                if (strlen($phone) > 6) {
                    return substr($phone, 0, 3) . '***' . substr($phone, -3);
                }
                return $phone;
            }),
            'avatar_url' => $this->avatar ? \Illuminate\Support\Facades\Storage::url($this->avatar) : null,
            'rating' => round((float) ($this->ratings_received_avg_rating ?? 0), 2),
            'subscription_status' => $this->hasActiveSubscription(),
            'permissions' => $this->whenLoaded('permissions', function () {
                return $this->permissions ? $this->permissions->pluck('name')->toArray() : [];
            }),
        ];
    }
}
