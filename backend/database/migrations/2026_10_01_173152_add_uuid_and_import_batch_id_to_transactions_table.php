<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('uuid')->nullable()->after('id');
            $table->string('import_batch_id')->nullable()->after('uuid');
            $table->index('import_batch_id', 'tx_import_batch_id_idx');
            $table->unique(['user_id', 'uuid'], 'tx_user_uuid_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropUnique('tx_user_uuid_unique');
            $table->dropIndex('tx_import_batch_id_idx');
            $table->dropColumn(['uuid', 'import_batch_id']);
        });
    }
};
