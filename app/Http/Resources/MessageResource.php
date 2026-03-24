<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
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
            'conversation_id' => $this->conversation_id,
            'content' => $this->content,
            'sender_id' => $this->sender_id,
            'is_me' => auth()->check() ? $this->sender_id === auth()->id() : false,
            'time_diff' => $this->created_at->diffForHumans(),
            'created_at' => $this->created_at,
        ];
    }
}
