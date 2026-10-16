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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id()->comment('Unique identifier for the account');
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('Reference to the owner of this account');
            $table->string('name')->comment('Display name of the account (e.g. Zenith Bank, Cash)');
            $table->enum('type', ['bank', 'mobile', 'cash'])->comment('Type of account: bank, mobile money, or physical cash');
            $table->decimal('starting_balance', 15, 2)->default(0)->comment('Initial balance when the account was added');
            $table->text('notes')->nullable()->comment('Optional notes about the account');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
