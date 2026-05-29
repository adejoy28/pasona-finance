<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            // Expense Categories
            ['name' => 'Food & Groceries', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Transport', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Healthcare', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Bank Charges', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Shopping', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Entertainment', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Utilities', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Rent', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Airtime & Data', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Education', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Savings', 'type' => 'expense', 'is_default' => true],
            ['name' => 'Tithe', 'type' => 'expense', 'is_default' => true],
            
            // Income Categories
            ['name' => 'Salary', 'type' => 'income', 'is_default' => true],
            ['name' => 'Freelance', 'type' => 'income', 'is_default' => true],
            ['name' => 'Gifts', 'type' => 'income', 'is_default' => true],
            ['name' => 'Investment', 'type' => 'income', 'is_default' => true],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category['name'], 'type' => $category['type']],
                ['is_default' => $category['is_default']]
            );
        }
    }
}
