<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email_type');
            $table->string('recipient_email');
            $table->string('subject')->nullable();
            $table->timestamp('sent_at');
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index('email_type');
            $table->index('sent_at');
            $table->index(['user_id', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
