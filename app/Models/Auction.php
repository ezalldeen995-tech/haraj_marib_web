<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Auction extends Model
{
    use \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'ad_id', 'start_price', 'current_price', 'min_bid_step', 
        'buy_it_now_price', 'end_time', 'status', 'winner_user_id',
    ];

    protected $casts = [
        'end_time' => 'datetime',
    ];

    public function ad()
    {
        return $this->belongsTo(Ad::class);
    }

    public function bids()
    {
        return $this->hasMany(Bid::class);
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }
}
