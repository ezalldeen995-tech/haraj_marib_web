<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use App\Models\Ad;
use App\Models\Payment;
use App\Observers\AdObserver;
use App\Observers\PaymentObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(\App\Contracts\AdRepositoryInterface::class, \App\Repositories\EloquentAdRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Ad::observe(AdObserver::class);
        Payment::observe(PaymentObserver::class);

        $this->configureRateLimiting();
    }

    /**
     * Configure named rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // Auth endpoints: 5 requests/minute (brute-force protection)
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Chat send: 30 messages/minute per user
        RateLimiter::for('chat', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // General API: 60 requests/minute per user or IP
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
