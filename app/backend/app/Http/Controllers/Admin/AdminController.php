<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\View\View;

class AdminController extends Controller
{
    public function login(): View
    {
        return view('admin.login');
    }

    public function authenticate(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $user = Auth::user();

            if (! $user->is_admin) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return back()->withErrors(['email' => 'The provided credentials do not match our records.'])->onlyInput('email');
            }

            $request->session()->regenerate();

            return redirect()->intended(route('admin.dashboard'));
        }

        return back()->withErrors(['email' => 'The provided credentials do not match our records.'])->onlyInput('email');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }

    public function dashboard(): View
    {
        $totalUsers    = User::count();
        $verifiedUsers = User::whereNotNull('email_verified_at')->count();
        $trashedUsers  = User::onlyTrashed()->count();
        $activeToday   = Transaction::whereDate('transaction_date', today())->distinct('user_id')->count('user_id');
        $emailsToday   = EmailLog::whereDate('sent_at', today())->count();
        $recentUsers   = User::latest()->take(5)->get();

        return view('admin.dashboard', compact('totalUsers', 'verifiedUsers', 'trashedUsers', 'activeToday', 'emailsToday', 'recentUsers'));
    }

    public function users(Request $request): View
    {
        $query = User::query()->select('users.*')
            ->selectSub(
                Transaction::selectRaw('MAX(transaction_date)')
                    ->whereColumn('user_id', 'users.id'),
                'last_transaction_date'
            );

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('trashed')) {
            $query->onlyTrashed();
        }

        $users = $query->latest()->paginate(20);

        return view('admin.users.index', compact('users'));
    }

    public function emails(Request $request): View
    {
        $query = EmailLog::query()->with('user');

        if ($request->filled('type')) {
            $query->where('email_type', $request->type);
        }

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_');
            $query->where('recipient_email', 'like', "%{$search}%");
        }

        $logs = $query->latest('sent_at')->paginate(30);
        $types = EmailLog::select('email_type')->distinct()->pluck('email_type')->sort()->values();

        return view('admin.emails.index', compact('logs', 'types'));
    }

    public function showUser(int $id): View
    {
        $user = User::withTrashed()->withCount(['accounts', 'transactions', 'categories'])->findOrFail($id);
        $emailLogs = EmailLog::where('user_id', $user->id)->latest('sent_at')->take(20)->get();

        $txDates = Transaction::where('user_id', $user->id)
            ->selectRaw('DISTINCT DATE(transaction_date) as date')
            ->pluck('date')
            ->map(fn ($d) => Carbon::parse($d))
        ;

        $dayCount = 60;
        $today = today();
        $activityDays = [];

        for ($i = $dayCount - 1; $i >= 0; $i--) {
            $date = $today->copy()->subDays($i);
            $hasTx = $txDates->first(fn (Carbon $d) => $d->isSameDay($date));

            $activityDays[] = [
                'class' => $hasTx ? 'has-tx' : '',
                'tip'   => $hasTx
                    ? $date->format('M j, Y') . ' — transactions recorded'
                    : $date->format('M j, Y') . ' — no transactions',
            ];
        }

        $activityDays[count($activityDays) - 1]['class'] .= ' today';

        $activeDaysCount = $txDates->count();
        $totalDaysSinceFirstTx = $user->transactions()->min('transaction_date');
        $totalDaysSpan = $totalDaysSinceFirstTx
            ? (int) max(1, today()->startOfDay()->diffInDays(Carbon::parse($totalDaysSinceFirstTx)->startOfDay()) + 1)
            : 0;

        $sortedDates = $txDates->sort(fn (Carbon $a, Carbon $b) => $a->timestamp <=> $b->timestamp)->values();
        $currentStreak = 0;
        $longestStreak = 0;
        $streak = 0;

        if ($sortedDates->isNotEmpty()) {
            $check = today();
            while ($sortedDates->first(fn (Carbon $d) => $d->isSameDay($check))) {
                $currentStreak++;
                $check = $check->copy()->subDay();
            }

            foreach ($sortedDates as $i => $d) {
                $streak++;
                if ($i === $sortedDates->count() - 1 || ! $sortedDates[$i + 1]->isSameDay($d->copy()->addDay())) {
                    if ($streak > $longestStreak) {
                        $longestStreak = $streak;
                    }
                    $streak = 0;
                }
            }
        }

        return view('admin.users.show', compact(
            'user', 'activityDays', 'activeDaysCount', 'totalDaysSpan', 'currentStreak', 'longestStreak', 'emailLogs'
        ));
    }

    public function updateUser(Request $request, int $id): RedirectResponse
    {
        $user = User::withTrashed()->findOrFail($id);

        $data = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'email'          => 'sometimes|email|max:255|unique:users,email,' . $id . ',id,deleted_at,NULL',
            'timezone'       => 'sometimes|nullable|string|max:64',
            'reminder_time'  => ['sometimes', 'nullable', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'is_admin'       => 'sometimes|boolean',
            'mark_verified'  => 'sometimes|boolean',
            'unmark_verified' => 'sometimes|boolean',
        ]);

        foreach (['name', 'email', 'timezone', 'reminder_time'] as $field) {
            if (array_key_exists($field, $data)) {
                $user->$field = $data[$field] ?: null;
            }
        }

        if (array_key_exists('is_admin', $data)) {
            $user->is_admin = (bool) $data['is_admin'];
        }

        if (! empty($data['mark_verified']) && ! $user->hasVerifiedEmail()) {
            $user->email_verified_at = now();
        }

        if (! empty($data['unmark_verified'])) {
            $user->email_verified_at = null;
        }

        $user->save();

        return back()->with('success', 'User profile updated.');
    }

    public function verifyEmail(int $id): RedirectResponse
    {
        $user = User::withTrashed()->findOrFail($id);

        if (! $user->email) {
            return back()->with('error', 'User has no email address.');
        }

        if ($user->hasVerifiedEmail()) {
            return back()->with('error', 'Email is already verified.');
        }

        $user->sendEmailVerificationNotification();

        return back()->with('success', 'Verification email sent.');
    }

    public function sendResetLink(int $id): RedirectResponse
    {
        $user = User::withTrashed()->findOrFail($id);

        if (! $user->email) {
            return back()->with('error', 'User has no email address.');
        }

        $status = Password::sendResetLink(['email' => $user->email]);

        $message = $status === Password::RESET_LINK_SENT
            ? 'Password reset link sent.'
            : 'Failed to send reset link.';

        return back()->with(
            $status === Password::RESET_LINK_SENT ? 'success' : 'error',
            $message
        );
    }

    public function setPassword(Request $request, int $id): RedirectResponse
    {
        $user = User::withTrashed()->findOrFail($id);

        $data = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->password = Hash::make($data['password']);
        $user->save();

        return back()->with('success', 'Password updated.');
    }

    public function impersonateUser(int $id): View
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->tokens()->delete();
        $token = $user->createToken('admin-impersonation')->plainTextToken;

        return back()->with([
            'success'               => 'Impersonation token generated.',
            'impersonation_token'   => $token,
            'impersonation_user'    => $user->email,
        ]);
    }

    public function deleteUser(int $id): RedirectResponse
    {
        $user = User::withTrashed()->findOrFail($id);

        if ($user->trashed()) {
            return back()->with('error', 'User is already deleted.');
        }

        $user->tokens()->delete();
        $user->transactions()->delete();
        $user->accounts()->delete();
        $user->categories()->delete();
        $user->delete();

        return back()->with('success', "User {$user->name} has been soft-deleted.");
    }

    public function restoreUser(int $id): RedirectResponse
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        return back()->with('success', "User {$user->name} has been restored.");
    }
}
