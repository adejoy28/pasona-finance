<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Composite indexes that match the real query paths:
     *  - (user_id, transaction_date)              paginated list, monthly summary
     *  - (user_id, account_id, transaction_date) duplicate detection, account-scoped reads
     *  - (user_id, type, transaction_date)       monthly income/expense aggregates
     *
     * `user_id` is the leading column on each so every read stays scoped to a tenant.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['user_id', 'transaction_date'], 'tx_user_date_idx');
            $table->index(['user_id', 'account_id', 'transaction_date'], 'tx_user_account_date_idx');
            $table->index(['user_id', 'type', 'transaction_date'], 'tx_user_type_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('tx_user_date_idx');
            $table->dropIndex('tx_user_account_date_idx');
            $table->dropIndex('tx_user_type_date_idx');
        });
    }
};
