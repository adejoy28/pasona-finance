<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Enforce that a user cannot have two categories with the same
     * (name, type) pair. The same name is allowed across types (e.g.
     * an income "Food" and an expense "Food") so the unique key includes
     * the type column.
     *
     * Default system categories use `user_id = null`, which sits outside
     * the unique index — they remain globally shared.
     *
     * Existing duplicates are collapsed first: the oldest row (lowest id)
     * is kept per (user_id, name, type) group, and any transactions whose
     * `category_id` points at a discarded row are redirected to the
     * survivor before the duplicates are deleted. This preserves the
     * category link on history rows (the original FK was
     * `onDelete('set null')` which would have silently nulled it).
     */
    public function up(): void
    {
        $groups = DB::table('categories')
            ->select('user_id', 'name', 'type', DB::raw('MIN(id) AS kept_id'))
            ->groupBy('user_id', 'name', 'type')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($groups as $group) {
            $duplicateIds = DB::table('categories')
                ->where('user_id', $group->user_id)
                ->where('name', $group->name)
                ->where('type', $group->type)
                ->where('id', '!=', $group->kept_id)
                ->pluck('id');

            foreach ($duplicateIds as $duplicateId) {
                DB::table('transactions')
                    ->where('category_id', $duplicateId)
                    ->update(['category_id' => $group->kept_id]);
            }

            DB::table('categories')
                ->where('user_id', $group->user_id)
                ->where('name', $group->name)
                ->where('type', $group->type)
                ->where('id', '!=', $group->kept_id)
                ->delete();
        }

        Schema::table('categories', function (Blueprint $table) {
            $table->unique(['user_id', 'name', 'type']);
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'name', 'type']);
        });
    }
};
