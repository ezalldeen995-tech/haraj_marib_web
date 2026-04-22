<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AuctionController extends Controller
{
    public function placeBid(Request $request, $auctionId)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'is_proxy' => 'boolean',
            'max_proxy_amount' => 'nullable|numeric|gte:amount',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Rate limiting logic
        $rateKey = 'bid_rate_' . $user->id;
        if (Cache::has($rateKey) && Cache::get($rateKey) >= 10) {
            return response()->json(['message' => 'Rate limit exceeded (10 bids per minute maximum).'], 429);
        }
        Cache::add($rateKey, 0, 60);
        Cache::increment($rateKey);

        $lock = Cache::lock('auction_bidding_' . $auctionId, 5); // 5 seconds lock
        
        try {
            $lock->block(3); // Wait for 3 seconds max

            return DB::transaction(function () use ($request, $auctionId, $user) {
                $auction = Auction::where('id', $auctionId)->lockForUpdate()->firstOrFail();

                if ($auction->ad->user_id === $user->id) {
                    abort(403, 'You cannot bid on your own auction.');
                }

                if ($auction->status !== 'active' || $auction->end_time <= now()) {
                    abort(400, 'Auction has ended or is inactive.');
                }

                $amount = $request->amount;
                $isProxy = $request->boolean('is_proxy');
                $maxProxyAmount = $request->max_proxy_amount;

                $minRequired = collect([$auction->current_price + $auction->min_bid_step, $auction->start_price])->max();
                if ($amount < $minRequired) {
                    abort(422, 'Bid amount must be at least ' . $minRequired);
                }

                // Retrieve the current highest proxy bid to evaluate
                $currentHighestProxy = Bid::where('auction_id', $auction->id)
                    ->where('is_proxy', true)
                    ->orderBy('max_proxy_amount', 'desc')
                    ->first();

                $winningAmount = $amount;
                $winningUser = $user->id;
                
                // Proxy logic resolution
                if ($currentHighestProxy && $currentHighestProxy->user_id !== $user->id) {
                    if ($currentHighestProxy->max_proxy_amount >= $amount) {
                        // Current proxy outbids the new bid
                        $winningAmount = collect([$amount + $auction->min_bid_step, $currentHighestProxy->max_proxy_amount])->min();
                        $winningUser = $currentHighestProxy->user_id;

                        // Add new user's outbid record
                        Bid::create([
                            'auction_id' => $auction->id,
                            'user_id' => $user->id,
                            'amount' => $amount,
                            'is_proxy' => $isProxy,
                            'max_proxy_amount' => $maxProxyAmount,
                            'status' => 'outbid'
                        ]);
                        
                        // What if the newly submitted bid was also a proxy but had lower max?
                        if ($isProxy && $maxProxyAmount > $amount) {
                            if ($currentHighestProxy->max_proxy_amount >= $maxProxyAmount) {
                                $winningAmount = collect([$maxProxyAmount + $auction->min_bid_step, $currentHighestProxy->max_proxy_amount])->min();
                                $winningUser = $currentHighestProxy->user_id;
                            } else {
                                $winningAmount = $currentHighestProxy->max_proxy_amount + $auction->min_bid_step;
                                $winningUser = $user->id;
                            }
                        }
                    } else {
                        // New bid beats the current proxy max
                        $winningAmount = $currentHighestProxy->max_proxy_amount + $auction->min_bid_step;
                        // Check if new user wanted a proxy or just standard bid over the previous proxy max
                        // The winning amount is slightly more than previous proxy max.
                    }
                }

                // If it reaches the Ad Target Price
                $targetPrice = $auction->buy_it_now_price ?? $auction->ad->price;
                if ($targetPrice > 0 && $winningAmount >= $targetPrice) {
                    $auction->status = 'ended';
                    $auction->winner_user_id = $winningUser;
                    $auction->end_time = now();
                    $winningAmount = $targetPrice;
                    
                    \App\Models\Order::create([
                        'ad_id' => $auction->ad_id,
                        'buyer_id' => $winningUser,
                        'seller_id' => $auction->ad->user_id,
                        'amount' => $winningAmount,
                        'status' => 'pending'
                    ]);
                }

                // Insert winning bid state
                $bid = Bid::create([
                    'auction_id' => $auction->id,
                    'user_id' => $winningUser,
                    'amount' => $winningAmount,
                    'is_proxy' => ($winningUser === $user->id) ? $isProxy : true,
                    'max_proxy_amount' => ($winningUser === $user->id) ? $maxProxyAmount : $currentHighestProxy->max_proxy_amount,
                    'status' => 'winning'
                ]);

                // Update outbid status for previous winning bids
                Bid::where('auction_id', $auction->id)
                    ->where('id', '!=', $bid->id)
                    ->where('status', 'winning')
                    ->update(['status' => 'outbid']);

                $auction->current_price = $winningAmount;
                $auction->save();
                
                // If the user placing request didn't win immediately due to proxy
                if ($winningUser !== $user->id) {
                    return response()->json([
                        'message' => 'You have been automatically outbid by an earlier proxy bid.',
                        'current_price' => $winningAmount
                    ], 200);
                }

                return response()->json([
                    'message' => 'Bid placed successfully!',
                    'current_price' => $winningAmount,
                    'status' => $auction->status
                ], 201);
            });
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            return response()->json(['message' => 'Could not acquire lock to place bid. Please try again.'], 409);
        } finally {
            $lock?->release();
        }
    }
    
    public function show($id)
    {
        $auction = Auction::with(['ad.user', 'ad.images', 'bids' => function($q) {
            $q->orderBy('created_at', 'desc')->take(10);
        }])->findOrFail($id);
        
        return view('ads.auction-details', compact('auction'));
    }
    
    public function apiData($id)
    {
        $auction = Auction::with(['bids' => function($q) {
            $q->orderBy('created_at', 'desc')->take(10);
        }, 'bids.user'])->findOrFail($id);
        
        return response()->json([
            'current_price' => $auction->current_price,
            'end_time' => $auction->end_time,
            'status' => $auction->status,
            'bids' => $auction->bids->map(function($bid) {
                return [
                    'amount' => $bid->amount,
                    'user' => $bid->user->name ?? 'Anonymous',
                    'time' => $bid->created_at->diffForHumans()
                ];
            })
        ]);
    }
}
