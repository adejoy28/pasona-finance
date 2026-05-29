<?php

namespace App\Http\Controllers\API;

/**
 * CategoryController File
 * 
 * Handles CRUD operations for transaction categories.
 */

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

/**
 * CategoryController Class
 * 
 * Manage income and expense categories.
 */
class CategoryController extends Controller
{
    /**
     * List all categories for the user (including default system categories).
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $categories = Category::where('is_default', true)
            ->orWhere('user_id', $request->user()->id)
            ->get();

        return response()->json($categories);
    }

    /**
     * Create a new custom category.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:income,expense',
        ]);

        $category = $request->user()->categories()->create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'is_default' => false,
        ]);

        return response()->json($category, 201);
    }

    /**
     * Display a specific category.
     */
    public function show(Category $category)
    {
        $this->authorize('view', $category);
        return response()->json($category);
    }

    /**
     * Update a custom category.
     */
    public function update(Request $request, Category $category)
    {
        $this->authorize('update', $category);

        if ($category->is_default) {
            return response()->json(['message' => 'Default categories cannot be updated.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:income,expense',
        ]);

        $category->update($validated);

        return response()->json($category);
    }

    /**
     * Delete a custom category.
     */
    public function destroy(Category $category)
    {
        $this->authorize('delete', $category);

        if ($category->is_default) {
            return response()->json(['message' => 'Default categories cannot be deleted.'], 403);
        }

        $category->delete();

        return response()->json(null, 204);
    }
}
