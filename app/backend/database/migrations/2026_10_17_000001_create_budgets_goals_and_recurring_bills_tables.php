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
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('month', 7)->comment('Month in YYYY-MM format');
            $table->decimal('limit_amount', 14, 2);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'category_id', 'month']);
            $table->index(['user_id', 'month']);
        });

        Schema::create('goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->decimal('target_amount', 14, 2);
            $table->decimal('saved_amount', 14, 2)->default(0);
            $table->date('target_date');
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('color', 32)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'target_date']);
        });

        Schema::create('recurring_bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->decimal('amount', 14, 2);
            $table->enum('type', ['expense', 'income'])->default('expense');
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('frequency', ['weekly', 'monthly', 'yearly'])->default('monthly');
            $table->date('next_due');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'next_due']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recurring_bills');
        Schema::dropIfExists('goals');
        Schema::dropIfExists('budgets');
    }
};
