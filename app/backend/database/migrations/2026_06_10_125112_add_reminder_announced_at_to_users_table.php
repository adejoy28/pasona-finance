<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('reminder_announced_at')
                ->nullable()
                ->after('reminder_last_sent_at')
                ->comment('Set when the "daily reminders are live" announcement was sent to this user.');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('reminder_announced_at');
        });
    }
};
