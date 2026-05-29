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
        Schema::create('categories', function (Blueprint $table) {
            $table->id()->comment('Unique identifier for the category');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade')->comment('Reference to the user who created it (null if default)');
            $table->string('name')->comment('Display name of the category (e.g. Food, Salary)');
            $table->enum('type', ['income', 'expense'])->comment('Whether this is an income or expense category');
            $table->boolean('is_default')->default(false)->comment('True if this is a pre-defined system category');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
