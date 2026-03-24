<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use App\Models\Setting;

class SettingController extends Controller
{
    public function index()
    {
        // Cache settings for 1 hour (3600 seconds)
        $settings = Cache::remember('settings', 60 * 60, function () {
            return Setting::all();
        });

        return $this->successResponse($settings, 'data_retrieved');
    }
}
