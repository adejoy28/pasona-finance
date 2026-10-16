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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id()->comment('Unique identifier for the transaction');
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('Reference to the owner of this transaction');
            $table->foreignId('account_id')->constrained()->onDelete('cascade')->comment('Reference to the primary account involved');
            $table->foreignId('to_account_id')->nullable()->constrained('accounts')->onDelete('cascade')->comment('Target account for transfers (null for income/expense)');
            $table->enum('type', ['income', 'expense', 'transfer'])->comment('Type of transaction');
            $table->foreignId('category_id')->nullable()->constrained()->onDelete('set null')->comment('Reference to the category (null for transfers)');
            $table->decimal('amount', 15, 2)->comment('Monetary value of the transaction');
            $table->string('description')->nullable()->comment('User-provided memo for the transaction');
            $table->string('reference')->nullable()->comment('Bank reference or unique external identifier');
            $table->date('transaction_date')->comment('The date when the transaction occurred');
            $table->boolean('is_synced')->default(true)->comment('Flag for offline-first sync (true if stored in PostgreSQL)');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
