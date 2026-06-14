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
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

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
     * Cached for 1 hour under "user:{id}:categories". The cache is busted
     * explicitly on every write (store/update/destroy) so stale data is
     * never served after a mutation.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Cache::remember returns the cached value or executes the closure,
        // stores the result, and returns it. TTL is 1 hour.
        $categories = Cache::remember(
            "user:{$user->id}:categories",
            now()->addHour(),
            fn () => $user->categories()->get()
        );

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
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')
                    ->where('user_id', $request->user()->id)
                    ->where('type', $request->input('type')),
            ],
            'type' => 'required|in:income,expense',
        ]);

        $category = $request->user()->categories()->create([
            'name' => $validated['name'],
            'type' => $validated['type'],
        ]);

        // Bust category cache (list changed) and summary cache (category
        // breakdown may have changed if this category already had transactions).
        Cache::forget("user:{$request->user()->id}:categories");
        Cache::forget("user:{$request->user()->id}:summary:" . now()->format('Y-m'));

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

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')
                    ->where('user_id', $request->user()->id)
                    ->where('type', $request->input('type', $category->type))
                    ->ignore($category->id),
            ],
            'type' => 'sometimes|required|in:income,expense',
        ]);

        $category->update($validated);

        // Bust category cache — the name/type may have changed.
        Cache::forget("user:{$request->user()->id}:categories");

        return response()->json($category);
    }

    /**
     * Delete a custom category.
     */
    public function destroy(Category $category)
    {
        $this->authorize('delete', $category);

        $category->delete();

        // Bust both caches — category list shrinks and summary breakdown changes.
        Cache::forget("user:{$category->user_id}:categories");
        Cache::forget("user:{$category->user_id}:summary:" . now()->format('Y-m'));

        return response()->json(null, 204);
    }
}
