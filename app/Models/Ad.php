<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ad extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id','category_id','title','description','price','currency',
        'address_text','lat','lng','status','is_featured','views_count','expires_at',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(AdImage::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function auction(): HasOne
    {
        return $this->hasOne(Auction::class);
    }

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::deleting(function ($ad) {
            // on force delete remove image files
            if ($ad->isForceDeleting()) {
                foreach ($ad->images as $img) {
                    if ($img->image_path) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($img->image_path);
                    }
                }
            }
        });
    }
}
