<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('auctions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_id')->constrained()->onDelete('cascade');
            $table->decimal('start_price', 15, 2);
            $table->decimal('current_price', 15, 2)->default(0);
            $table->decimal('min_bid_step', 10, 2)->default(1);
            $table->decimal('buy_it_now_price', 15, 2)->nullable();
            $table->timestamp('end_time');
            $table->enum('status', ['active', 'ended', 'cancelled'])->default('active');
            $table->foreignId('winner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auctions');
    }
};
