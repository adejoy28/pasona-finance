<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique()->comment('Slug identifier, e.g. "reminder-announcement"');
            $table->string('subject');
            $table->string('template')->comment('Blade template path, e.g. "emails.reminder-announcement"');
            $table->text('template_vars')->nullable()->comment('JSON of default template variables');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
