<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);
        
        $custom = [
            'formatted_price' => number_format($this->price, 2) . ' YER', // YER according to Yemen Riyal
            'images' => $this->images->map(function ($image) {
                return [
                    'id' => $image->id,
                    'image_path' => asset('storage/' . $image->image_path),
                ];
            })->toArray(),
            'user' => new UserResource($this->user),
            'category' => $this->category,
            'is_favorited' => (bool) ($this->is_favorited ?? false),
            'comments' => $this->whenLoaded('comments', function () {
                return $this->comments->map(function ($comment) {
                    return [
                        'id' => $comment->id,
                        'content' => $comment->content,
                        'user_id' => $comment->user_id,
                        'user' => $comment->user ? [
                            'id' => $comment->user->id,
                            'name' => $comment->user->name,
                        ] : null,
                        'created_at' => $comment->created_at->toISOString(),
                    ];
                });
            }),
            'created_at_diff' => $this->created_at->diffForHumans(),
        ];

        return array_merge($data, $custom);
    }
}
