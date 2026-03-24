<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = ['user_id','receipt_image','amount','status','type','admin_notes','months'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
