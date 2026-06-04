<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Enforce that a user cannot have two accounts with the same name.
     *
     * Existing duplicates are collapsed first: the oldest row (lowest id) is
     * kept per (user_id, name) group, and any transactions pointing at the
     * discarded rows are redirected to the survivor before the duplicates
     * are deleted. Without the redirect, the FK cascade on transactions
     * would erase the user's history.
     */
    public function up(): void
    {
        $groups = DB::table('accounts')
            ->select('user_id', 'name', DB::raw('MIN(id) AS kept_id'))
            ->groupBy('user_id', 'name')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($groups as $group) {
            $duplicateIds = DB::table('accounts')
                ->where('user_id', $group->user_id)
                ->where('name', $group->name)
                ->where('id', '!=', $group->kept_id)
                ->pluck('id');

            foreach ($duplicateIds as $duplicateId) {
                DB::table('transactions')
                    ->where('account_id', $duplicateId)
                    ->update(['account_id' => $group->kept_id]);

                DB::table('transactions')
                    ->where('to_account_id', $duplicateId)
                    ->update(['to_account_id' => $group->kept_id]);
            }

            DB::table('accounts')
                ->where('user_id', $group->user_id)
                ->where('name', $group->name)
                ->where('id', '!=', $group->kept_id)
                ->delete();
        }

        Schema::table('accounts', function (Blueprint $table) {
            $table->unique(['user_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'name']);
        });
    }
};
