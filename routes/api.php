<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\NotificationController;

// Public endpoints (auth rate limiter: 5 requests/minute)
Route::middleware('throttle:auth')->group(function () {
    Route::post('register', [AuthController::class , 'register']);
    Route::post('login', [AuthController::class , 'login']);
    Route::post('otp/request', [AuthController::class , 'requestOtp']);
    Route::post('otp/verify', [AuthController::class , 'verifyOtp']);
    Route::post('password/forgot', [AuthController::class , 'forgotPassword']);
    Route::post('password/reset', [AuthController::class , 'resetPassword']);
});

// Ad routes (public, general rate limit: 60/minute)
Route::middleware('throttle:api')->group(function () {
    Route::get('ads', [AdController::class , 'index']);
    Route::get('ads/{id}', [AdController::class , 'show']);
    Route::get('auctions/{id}', [\App\Http\Controllers\AuctionController::class, 'apiData']);

    // Public categories & settings
    Route::get('categories', [\App\Http\Controllers\CategoryController::class , 'index']);
    Route::get('settings', [\App\Http\Controllers\SettingController::class , 'index']);
});

// Protected endpoints (general rate limit: 60/minute)
Route::middleware(['auth:api', 'throttle:api'])->group(function () {
    Route::get('profile', [UserController::class , 'profile']);
    Route::post('profile/update', [UserController::class , 'updateProfile']);
    Route::post('profile/avatar', [UserController::class , 'updateAvatar']);
    Route::post('profile/token', [UserController::class , 'updateDeviceToken']);
    Route::delete('profile/delete', [UserController::class , 'deleteAccount']);

    Route::post('logout', [AuthController::class , 'logout']);
    Route::post('refresh', [AuthController::class , 'refresh']);
    Route::get('me', [AuthController::class , 'me']);

    // Ad routes (protected)
    Route::post('ads', [AdController::class , 'store']);
    Route::put('ads/{id}', [AdController::class , 'update']);
    Route::delete('ads/{id}', [AdController::class , 'destroy']);
    Route::post('ads/{id}/renew', [AdController::class , 'renew']);
    Route::post('ads/{id}/restore', [AdController::class , 'restore']);
    
    // Auction routes (protected)
    Route::post('auctions/{id}/bid', [\App\Http\Controllers\AuctionController::class, 'placeBid']);

    // Chat routes (chat send uses stricter limiter)
    Route::post('chat/start', [ChatController::class , 'startOrGetConversation']);
    Route::post('chat/send', [ChatController::class , 'sendMessage'])->middleware('throttle:chat');
    Route::get('chats', [ChatController::class , 'myConversations']);
    Route::get('chats/{id}/messages', [ChatController::class , 'getMessages']);

    // Payment routes
    Route::post('payments/request', [PaymentController::class , 'requestSubscription']);
    Route::get('payments', [PaymentController::class , 'myPayments']);

    // Order routes
    Route::get('orders', [\App\Http\Controllers\OrderController::class, 'myOrders']);
    Route::post('orders', [\App\Http\Controllers\OrderController::class, 'store']);
    Route::get('orders/{id}', [\App\Http\Controllers\OrderController::class, 'show']);
    Route::post('orders/{id}/upload-proof', [\App\Http\Controllers\OrderController::class, 'uploadProof']);
    Route::post('orders/{id}/review', [\App\Http\Controllers\OrderController::class, 'reviewProof']);

    // comment & rating endpoints
    Route::post('comments', [\App\Http\Controllers\CommentController::class , 'store']);
    Route::delete('comments/{id}', [\App\Http\Controllers\CommentController::class , 'destroy']);
    Route::post('ratings', [\App\Http\Controllers\RatingController::class , 'store']);

    // favorite endpoints
    Route::post('favorites/toggle', [\App\Http\Controllers\FavoriteController::class , 'toggleFavorite']);
    Route::get('favorites', [\App\Http\Controllers\FavoriteController::class , 'myFavorites']);

    // blocking
    Route::post('block/toggle', [\App\Http\Controllers\BlockController::class , 'toggleBlock']);

    // contact
    Route::post('contact', [\App\Http\Controllers\ContactController::class , 'store']);

    // reports
    Route::post('reports', [\App\Http\Controllers\ReportController::class , 'store']);

    // notifications
    Route::get('notifications', [NotificationController::class , 'index']);
    Route::get('notifications/unread-count', [NotificationController::class , 'unreadCount']);
    Route::post('notifications/{id}/read', [NotificationController::class , 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class , 'markAllAsRead']);

    // admin contact list (moved to admin guarded routes below)

    // admin only endpoints
    Route::middleware([\App\Http\Middleware\RoleMiddleware::class . ':admin'])->prefix('admin')->group(function () {
            
            // Permissions & Roles API
            Route::get('roles', [\App\Http\Controllers\Api\Admin\RoleController::class, 'index'])->middleware('permission:manage_users');
            Route::post('roles/{id}/sync', [\App\Http\Controllers\Api\Admin\RoleController::class, 'sync'])->middleware('permission:manage_users');
            
            // Admin Users API (Manage Sub-admins)
            Route::get('admins', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'index'])->middleware('permission:manage_users');
            Route::post('admins', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'store'])->middleware('permission:manage_users');
            Route::get('admins/{id}', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'show'])->middleware('permission:manage_users');
            Route::put('admins/{id}', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'update'])->middleware('permission:manage_users');
            Route::delete('admins/{id}', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'destroy'])->middleware('permission:manage_users');

            Route::get('stats', [\App\Http\Controllers\DashboardController::class , 'stats']); // New stats endpoint using existing controller
            Route::get('users', [AdminController::class , 'users']);
            Route::post('users/{id}/toggle-block', [AdminController::class , 'toggleBlockUser']);
            Route::get('ads', [AdminController::class , 'allAds']);
            Route::get('auctions', [AdminController::class , 'allAuctions']);

            Route::get('payments/pending', [AdminController::class , 'pendingPayments']);
            Route::post('payments/{id}/approve', [AdminController::class , 'approvePayment']);
            Route::post('payments/{id}/reject', [AdminController::class , 'rejectPayment']);
            Route::post('ads/{id}/approve', [AdminController::class , 'approveAd']);
            Route::post('ads/{id}/reject', [AdminController::class , 'rejectAd']);

            // Orders
            Route::get('orders', [\App\Http\Controllers\Api\Admin\OrderController::class, 'index']);
            Route::post('orders/{id}/review', [\App\Http\Controllers\Api\Admin\OrderController::class, 'review']);

            Route::get('activity-logs', [AdminController::class , 'logs']);
            Route::get('contact-messages', [AdminController::class , 'contactMessages']);
            Route::delete('contact-messages/{id}', [\App\Http\Controllers\ContactController::class , 'destroy']);
            Route::get('reports', [AdminController::class , 'reports']);
            Route::post('reports/{id}/dismiss', [AdminController::class , 'dismissReport']);
            Route::post('notifications/send', [AdminController::class , 'sendNotifications']);
            Route::get('analytics', [AdminController::class , 'getAnalytics']);

            Route::get('categories', [\App\Http\Controllers\CategoryController::class , 'index']);
            Route::post('categories', [\App\Http\Controllers\CategoryController::class , 'store']);
            Route::put('categories/{id}', [\App\Http\Controllers\CategoryController::class , 'update']);
            Route::delete('categories/{id}', [\App\Http\Controllers\CategoryController::class , 'destroy']);

            Route::match (['get', 'post'], 'settings', [AdminController::class , 'settings']);
            Route::get('dashboard/stats', [\App\Http\Controllers\DashboardController::class , 'stats']);
            Route::get('ads/trashed', [AdminController::class , 'trashedAds']);
            Route::delete('ads/{id}', [AdminController::class , 'deleteAd']);
            Route::post('ads/{id}/restore', [AdminController::class , 'restoreAd']);
            Route::delete('ads/{id}/force', [AdminController::class , 'forceDeleteAd']);
        });    });