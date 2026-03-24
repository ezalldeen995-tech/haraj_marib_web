<?php

use App\Models\Setting;

if (!function_exists('get_setting')) {
    function get_setting(string $key, $default = null)
    {
        return Setting::get($key, $default);
    }
}

if (!function_exists('set_setting')) {
    function set_setting(string $key, $value)
    {
        return Setting::set($key, $value);
    }
}
