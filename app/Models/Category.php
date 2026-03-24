<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'name_ar', 'name_en', 'icon', 'parent_id', 'is_active'];

    public function ads(): HasMany
    {
        return $this->hasMany(Ad::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class , 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class , 'parent_id');
    }
}
