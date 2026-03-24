<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds performance indexes to frequently queried columns.
     */
    public function up(): void
    {
        // Ads: status filtering, expiry checks, sorting
        Schema::table('ads', function (Blueprint $table) {
            $table->index('status');
            $table->index('expires_at');
            $table->index('created_at');
        });

        // Payments: pending payment lookups
        Schema::table('payments', function (Blueprint $table) {
            $table->index('status');
        });

        // Messages: chat history retrieval + unread count
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['conversation_id', 'created_at']);
            $table->index(['sender_id', 'is_read']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ads', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['expires_at']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['conversation_id', 'created_at']);
            $table->dropIndex(['sender_id', 'is_read']);
        });
    }
};
