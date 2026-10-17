<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('reminder_last_sent_at')
                ->nullable()
                ->after('reminder_time')
                ->comment('Wall-clock of the last daily reminder email sent to this user; used to dedupe.');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('reminder_last_sent_at');
        });
    }
};
