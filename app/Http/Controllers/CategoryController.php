<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function index()
    {
        // Cache categories for 1 hour (3600 seconds)
        $categories = Cache::remember('categories', 60 * 60, function () {
            return Category::all();
        });

        return $this->successResponse($categories, 'data_retrieved');
    }
}
