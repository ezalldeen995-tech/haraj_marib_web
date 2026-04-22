<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Auction;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ResolveAuctions extends Command
{
    protected $signature = 'app:resolve-auctions';
    protected $description = 'Resolve ended auctions, determine winners, and issue order requests.';

    public function handle()
    {
        $auctions = Auction::where('status', 'active')
            ->where('end_time', '<=', now())
            ->get();

        foreach ($auctions as $auction) {
            $lock = Cache::lock('auction_bidding_' . $auction->id, 10);
            
            try {
                if ($lock->get()) {
                    DB::transaction(function () use ($auction) {
                        // Re-fetch with row lock just in case
                        $auction = Auction::where('id', $auction->id)->lockForUpdate()->first();
                        
                        if ($auction->status !== 'active') return;
                        
                        $highestBid = $auction->bids()->where('status', 'winning')->orderBy('amount', 'desc')->first();
                        
                        $auction->status = 'ended';
                        
                        if ($highestBid) {
                            $auction->winner_user_id = $highestBid->user_id;
                            $auction->current_price = $highestBid->amount;
                            
                            // Generate order request
                            Order::create([
                                'ad_id' => $auction->ad_id,
                                'buyer_id' => $highestBid->user_id,
                                'seller_id' => $auction->ad->user_id,
                                'amount' => $highestBid->amount,
                                'status' => 'pending'
                            ]);
                            
                            $this->info("Auction {$auction->id} resolved. Winner: {$highestBid->user_id}");
                        } else {
                            $this->info("Auction {$auction->id} ended without bids.");
                        }

                        $auction->save();
                    });
                }
            } catch (\Exception $e) {
                Log::error("Failed to resolve auction {$auction->id}: " . $e->getMessage());
            } finally {
                $lock?->release();
            }
        }
    }
}
