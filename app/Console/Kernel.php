<?php

/**
 * Console Kernel — Command Registration & Task Scheduling
 *
 * CRON SETUP (Server):
 * Add this single entry to your server's crontab (crontab -e):
 *
 *   * * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
 *
 * This runs Laravel's scheduler every minute. Laravel then internally
 * checks which scheduled tasks are due (e.g., ads:expire every 6 hours)
 * and executes only those that are ready.
 *
 * On Windows (Task Scheduler), create a task that runs every minute:
 *   Program: php
 *   Arguments: C:\path\to\project\artisan schedule:run
 */

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        Commands\ExpireAds::class,
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Check for expired ads every 6 hours for timely expiration
        $schedule->command('ads:expire')
            ->everySixHours()
            ->withoutOverlapping()
            ->runInBackground()
            ->onOneServer();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
        require base_path('routes/console.php');
    }
}
