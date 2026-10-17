<?php

namespace App\Policies;

use App\Models\RecurringBill;
use App\Models\User;

class RecurringBillPolicy
{
    public function view(User $user, RecurringBill $recurringBill): bool
    {
        return $user->id === $recurringBill->user_id;
    }

    public function update(User $user, RecurringBill $recurringBill): bool
    {
        return $user->id === $recurringBill->user_id;
    }

    public function delete(User $user, RecurringBill $recurringBill): bool
    {
        return $user->id === $recurringBill->user_id;
    }
}
