<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $other_user = $this->buyer_id === auth()->id() ? $this->seller : $this->buyer;
        $last_message = $this->messages->first(); // Use pre-loaded relation (not query method)

        return [
            'id' => $this->id,
            'ad' => new AdResource($this->ad),
            'other_user' => new UserResource($other_user),
            'last_message' => $last_message ? new MessageResource($last_message) : null,
            'unread_count' => $this->unread_count ?? 0, // Pre-loaded via withCount in controller
        ];
    }
}
