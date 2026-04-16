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

    public function store(\Illuminate\Http\Request $request)
    {
        $data = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'icon' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'nullable|boolean'
        ]);

        // Default is_active to 1 if not provided
        if (!isset($data['is_active'])) {
            $data['is_active'] = 1;
        }

        if ($request->hasFile('icon')) {
            $filename = \App\Services\ImageService::uploadAndResize($request->file('icon'), 'categories');
            $data['icon'] = 'categories/' . $filename;
        }

        $category = Category::create($data);
        Cache::forget('categories');

        return $this->successResponse($category, 'category_created', 201);
    }

    public function update(\Illuminate\Http\Request $request, $id)
    {
        $category = Category::findOrFail($id);
        
        $data = $request->validate([
            'name_ar' => 'string|max:255',
            'name_en' => 'string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'nullable|boolean'
        ]);

        if ($request->hasFile('icon')) {
            // Delete old icon if exists
            if ($category->icon) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($category->icon);
            }
            $filename = \App\Services\ImageService::uploadAndResize($request->file('icon'), 'categories');
            $data['icon'] = 'categories/' . $filename;
        }

        $category->update($data);
        Cache::forget('categories');

        return $this->successResponse($category, 'category_updated');
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        
        // Delete icon if exists
        if ($category->icon) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($category->icon);
        }

        $category->delete();
        Cache::forget('categories');

        return $this->successResponse(null, 'category_deleted');
    }
}
