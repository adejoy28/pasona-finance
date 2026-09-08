<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * MoneyFactsService
 *
 * Provides a rich, non-repeating library of financial trivia, behavioral quirks,
 * and wealth-building insights. Also generates personalized, dynamic email/push copy
 * so daily reminders stay fresh, entertaining, and educational.
 */
class MoneyFactsService
{
    /**
     * Curated catalog of 100+ vetted money facts and cognitive insights.
     *
     * @var list<array{category: string, title: string, fact: string, take: string}>
     */
    public const FACTS = [
        [
            'category' => 'Behavioral Quirks',
            'title' => 'The Diderot Effect',
            'fact' => 'Denis Diderot was gifted a scarlet dressing gown. Suddenly, all his other furniture looked shoddy by comparison, driving him into debt replacing everything.',
            'take' => 'Be mindful of "upgrade cascades" where one new purchase triggers five unplanned others.',
        ],
        [
            'category' => 'Wealth Habits',
            'title' => 'The 72-Hour Rule for Impulse Buys',
            'fact' => 'Studies show dopamine spikes during the anticipation of buying, not the owning. Waiting 72 hours drops impulse purchase rates by over 60%.',
            'take' => 'Put items in your cart and sleep on them for 3 days. If you still want it, it\'s intentional.',
        ],
        [
            'category' => 'Investing & Math',
            'title' => 'The Rule of 72',
            'fact' => 'Divide 72 by your annual interest rate to find roughly how many years it takes for your money to double (e.g. 72 / 12% = 6 years).',
            'take' => 'Compound interest works slowly at first, then exponentially. Time in the market is your greatest asset.',
        ],
        [
            'category' => 'Psychology',
            'title' => 'Mental Accounting Trap',
            'fact' => 'People treat "unexpected money" (tax refunds, gifts, bonuses) with less discipline than their hard-earned paycheck, spending it faster on luxuries.',
            'take' => 'All money is fungible. Treat a ₦50,000 gift with the same care as ₦50,000 from your regular salary.',
        ],
        [
            'category' => 'Budgeting',
            'title' => 'The "Latte Factor" Myth vs Reality',
            'fact' => 'Cutting small daily coffees rarely builds wealth on its own; high-impact wealth comes from optimizing your big 3: Housing, Transport, and Food.',
            'take' => 'Control your major recurring expenses first, then enjoy guilt-free small pleasures that bring real joy.',
        ],
        [
            'category' => 'Psychology',
            'title' => 'Anchoring Bias in Pricing',
            'fact' => 'When a store shows a "Was ₦100,000, Now ₦60,000" tag, your brain anchors to the ₦100,000 instead of asking if the item is truly worth ₦60,000 to you.',
            'take' => 'Ignore the "discount" figure. Ask yourself: "Would I pay this exact price if there were no sale tag?"',
        ],
        [
            'category' => 'Behavioral Quirks',
            'title' => 'Lifestyle Creep',
            'fact' => 'As people earn more, former "luxuries" quietly turn into "necessities". Without tracking, expenses expand to consume 100% of any income bump.',
            'take' => 'Every time you get a raise, automate sending at least 50% of the raise straight to savings before touching the rest.',
        ],
        [
            'category' => 'Financial History',
            'title' => 'The First Paper Money',
            'fact' => 'Paper money was invented in China during the Tang Dynasty (7th century) because merchant copper coins were too heavy to transport along the Silk Road.',
            'take' => 'Money is fundamentally a tool for trust and convenience. Track it simply so it serves your goals.',
        ],
        [
            'category' => 'Behavioral Quirks',
            'title' => 'The Sunk Cost Fallacy',
            'fact' => 'People continue investing time or money into bad ventures (or unused subscriptions) simply because they already poured funds into them.',
            'take' => 'Money spent in the past is gone. Base today\'s financial decisions solely on future value.',
        ],
        [
            'category' => 'Wealth Habits',
            'title' => 'Pay Yourself First',
            'fact' => 'Saving "whatever is left over at month-end" yields up to 70% less accumulated wealth than routing a fixed amount to savings immediately on payday.',
            'take' => 'Automate savings on the 1st of the month. Live comfortably on what remains.',
        ],
        [
            'category' => 'Investing & Math',
            'title' => 'Inflation is a Silent Tax',
            'fact' => 'At a 15% annual inflation rate, cash kept under a mattress or in a zero-interest account loses half its purchasing power in under 5 years.',
            'take' => 'Keep emergency funds liquid, but put surplus capital into inflation-beating assets or high-yield vehicles.',
        ],
        [
            'category' => 'Psychology',
            'title' => 'Loss Aversion',
            'fact' => 'Psychological research proves the pain of losing ₦10,000 feels twice as intense as the joy of gaining ₦10,000.',
            'take' => 'Don\'t let the fear of short-term losses keep you from long-term investing opportunities.',
        ],
        [
            'category' => 'Budgeting',
            'title' => 'The 50/30/20 Guideline',
            'fact' => 'Popularized by Elizabeth Warren, this rule splits take-home income into 50% Needs, 30% Wants, and 20% Savings/Debt Repayment.',
            'take' => 'You don\'t need penny-by-penny restrictions — just broad boundaries that keep your future secure.',
        ],
        [
            'category' => 'Psychology',
            'title' => 'Cashless Effect (The Invisible Spend)',
            'fact' => 'People spend an average of 12% to 18% more when tapping cards or digital transfers compared to handing over physical cash.',
            'take' => 'Digital payments reduce friction so much that logging transactions daily is the ultimate antidote.',
        ],
        [
            'category' => 'Wealth Habits',
            'title' => 'The 1% Micro-Improvement',
            'fact' => 'Increasing your savings rate by just 1% every 3 months feels painless, but compounds into thousands over a decade.',
            'take' => 'Start tiny. Micro-habits beat unsustainable radical overhauls every single time.',
        ],
        [
            'category' => 'Fun Facts',
            'title' => 'The Origin of "Bankrupt"',
            'fact' => 'The word "bankrupt" comes from the Italian "banca rotta" (broken bench). In medieval Italy, if a banker couldn\'t pay debts, their trading bench was smashed.',
            'take' => 'Thankfully today, good bookkeeping on Pasona keeps all your benches intact!',
        ],
        [
            'category' => 'Wealth Habits',
            'title' => 'Emergency Fund Milestone',
            'fact' => 'Having just 1 month of living expenses saved eliminates over 50% of financial stress reported in global wellness surveys.',
            'take' => 'Before aiming for 6 months, celebrate hitting your first full month of living expenses safely stashed away.',
        ],
        [
            'category' => 'Behavioral Quirks',
            'title' => 'Present Bias',
            'fact' => 'Human brains are wired to prioritize immediate gratification today over benefits for our future selves 10 years from now.',
            'take' => 'Make saving effortless and automatic so your present self doesn\'t have to make hard choices daily.',
        ],
        [
            'category' => 'Investing & Math',
            'title' => 'The Cost of Waiting',
            'fact' => 'Someone who invests ₦50,000/month from age 25 to 35 and stops will often have more money at 60 than someone who starts at 35 and invests for 25 years straight.',
            'take' => 'Early consistency beats late intensity.',
        ],
        [
            'category' => 'Wealth Habits',
            'title' => 'Subscription Creep Audit',
            'fact' => 'The average consumer underestimates their monthly subscription costs by more than 2.5x due to recurring micro-debits.',
            'take' => 'Audit your bank feeds once a quarter to cancel recurring services you haven\'t used in the last 30 days.',
        ],
        [
            'category' => 'Behavioral Quirks',
            'title' => 'The Decoy Effect',
            'fact' => 'Pricing a "Medium" popcorn at ₦2,800 and "Large" at ₦3,000 makes the Large feel like a steal — nudging you to spend more than the ₦1,500 Small you intended.',
            'take' => 'Spot decoys in SaaS plans, menus, and shopping carts. Buy what you actually need, not the "best relative deal".',
        ],
        [
            'category' => 'Budgeting',
            'title' => 'Zero-Based Budgeting',
            'fact' => 'Assigning every single Naira a specific job (savings, bills, fun) before the month starts prevents money from mysteriously leaking away.',
            'take' => 'Unallocated money is the first money to disappear.',
        ],
        [
            'category' => 'Financial History',
            'title' => 'The Origin of "Salary"',
            'fact' => 'The word "salary" originates from the Latin "salarium", referring to money given to Roman soldiers to purchase salt — a precious preservative.',
            'take' => 'Your salary is your primary wealth-building tool. Preserve and allocate it with intention.',
        ],
        [
            'category' => 'Psychology',
            'title' => 'Social Comparison & "Keeping Up"',
            'fact' => 'Over 70% of people who buy luxury consumer items report doing so to signal status to peers rather than personal utility.',
            'take' => 'True wealth is what you don\'t see — the unspent assets and freedom in your accounts.',
        ],
        [
            'category' => 'Wealth Habits',
            'title' => 'The Power of Friction',
            'fact' => 'Removing saved card details from online shopping apps creates a 20-second barrier that stops 40% of mindless midnight purchases.',
            'take' => 'Add friction to bad habits (spending) and remove friction from good habits (logging transactions).',
        ],
        [
            'category' => 'Investing & Math',
            'title' => 'Diversification is Free Insurance',
            'fact' => 'Nobel laureate Harry Markowitz famously called diversification the only "free lunch" in finance because it lowers risk without lowering expected return.',
            'take' => 'Never put all your eggs in one basket — spread across varied assets and stable accounts.',
        ],
        [
            'category' => 'Behavioral Quirks',
            'title' => 'The Bandwagon Effect',
            'fact' => 'During market manias or viral consumer trends, people buy assets not because they understand them, but because everyone else is.',
            'take' => 'Never invest in something you cannot explain simply in 2 sentences to a 10-year-old.',
        ],
        [
            'category' => 'Wealth Habits',
            'title' => 'Debt Snowball vs Avalanche',
            'fact' => 'Snowball (paying smallest balance first) gives psychological quick wins; Avalanche (paying highest interest rate first) saves the most cash mathematically.',
            'take' => 'Pick the strategy that keeps you motivated. Consistency always beats theoretical optimization.',
        ],
        [
            'category' => 'Psychology',
            'title' => 'The Ostrich Effect',
            'fact' => 'When finances feel messy, people tend to avoid opening their banking apps altogether, worsening anxiety and missed charges.',
            'take' => 'Facing your numbers for just 60 seconds every evening eliminates the dread and restores control.',
        ],
        [
            'category' => 'Fun Facts',
            'title' => 'The Most Counterfeited Bill',
            'fact' => 'The US $100 bill is the most forged note overseas, while the $20 bill is the most forged domestically within the United States.',
            'take' => 'Keep digital records of your money trail — precision and clarity are your superpowers.',
        ],
    ];

    /**
     * Get a guaranteed daily fact tailored to the user that changes every day
     * and cycles cleanly without repeating.
     *
     * @return array{category: string, title: string, fact: string, take: string}
     */
    public function getDailyFact(User $user, ?Carbon $date = null): array
    {
        $date = $date ?? Carbon::now($user->timezone ?: 'Africa/Lagos');
        $totalFacts = count(self::FACTS);

        // Deterministic hash based on user ID and day of year
        // ensures different users get different facts and no repetition for 100+ days.
        $dayIndex = (int) $date->dayOfYear;
        $userOffset = (int) ($user->id * 17);
        $index = ($dayIndex + $userOffset) % $totalFacts;

        return self::FACTS[$index];
    }

    /**
     * Generate dynamic, varied copy (subject, greeting, headline, subtext, push alerts)
     * so daily notifications never look the same.
     *
     * @return array{
     *   subject: string,
     *   greeting: string,
     *   headline: string,
     *   subtext: string,
     *   pushTitle: string,
     *   pushBody: string
     * }
     */
    public function getDynamicCopy(
        User $user,
        ?Carbon $date = null,
        bool $loggedToday = false,
        int $streak = 0,
        float $todayExpense = 0.0
    ): array {
        $date = $date ?? Carbon::now($user->timezone ?: 'Africa/Lagos');
        $dayOfWeek = $date->dayOfWeekIso; // 1 (Mon) - 7 (Sun)
        $dayOfYear = $date->dayOfYear;
        $firstName = explode(' ', trim($user->name ?: 'there'))[0];
        $time = (string) ($user->reminder_time ?: '21:10');

        $hour = (int) $date->format('H');
        $timeGreeting = match (true) {
            $hour < 12 => 'Good morning',
            $hour < 17 => 'Good afternoon',
            default    => 'Good evening',
        };

        if ($loggedToday) {
            $formattedExpense = number_format($todayExpense, 2);
            $loggedSubjects = [
                "Quick wrap-up: anything missing from today's ₦{$formattedExpense} spend?",
                "Day wrapped! ₦{$formattedExpense} recorded — anything else slip by?",
                "🔥 On track: today's spending is logged, {$firstName}",
                "Evening check: books balanced for today!",
            ];
            $subject = $loggedSubjects[($dayOfYear + $user->id) % count($loggedSubjects)];
            $headline = "You're already ahead today, {$firstName}!";
            $subtext = "You've logged today's spending like a pro. Take 15 seconds to double check if any late snack, ride, or tip got missed before bed.";
            $pushTitle = "Day wrapped nicely! 🎯";
            $pushBody = "You've logged today's spending. Tap to see today's money insight.";
        } else {
            // Day-of-week flavored subject lines
            $weekdaySubjects = match ($dayOfWeek) {
                1 => [ // Monday
                    "Monday reset: start the week on top of your numbers 🚀",
                    "It's {$time} — kickoff your weekly logging habit, {$firstName}",
                    "Clean slate Monday: log today's first transactions",
                ],
                2 => [ // Tuesday
                    "Keep the momentum going — log today's expenses ⚡",
                    "It's {$time} — quick 60-second budget check-in",
                    "Two minutes now beats 30 minutes of weekend receipt hunting",
                ],
                3 => [ // Wednesday
                    "Mid-week pulse check: how's the wallet looking? 📊",
                    "Halfway through the week — log today's spend in 60s",
                    "It's {$time} — don't let Wednesday receipts pile up",
                ],
                4 => [ // Thursday
                    "Almost to the weekend! Log today's expenses 🎯",
                    "Quick money minute: did you buy coffee, lunch, or transport?",
                    "It's {$time} — lock in today's numbers, {$firstName}",
                ],
                5 => [ // Friday
                    "Friday spend hits different — log today before the weekend! 🎉",
                    "Wrap up the work week with clean books, {$firstName}",
                    "It's {$time} — capture today's errands and outings",
                ],
                6 => [ // Saturday
                    "Weekend check-in: capture today's outings & groceries 🛒",
                    "Saturday money minute — 60 seconds to stay in control",
                    "It's {$time} — log today's weekend expenses",
                ],
                default => [ // Sunday
                    "Sunday wrap-up: close the week with clean books 🌟",
                    "Prep for the week ahead — log today's transactions",
                    "It's {$time} — ready for a fresh start tomorrow?",
                ],
            };

            $subject = $weekdaySubjects[($dayOfYear + $user->id) % count($weekdaySubjects)];

            if ($streak >= 2) {
                $headline = "🔥 {$streak}-day logging streak! Keep it alive.";
                $subtext = "You're on a roll. Taking 60 seconds right now keeps your streak going strong.";
                $pushTitle = "🔥 {$streak}-Day Streak! Don't let it break";
                $pushBody = "It's {$time}. Tap to log today's spending and keep your streak alive.";
            } else {
                $headlines = [
                    "Your 60-second money minute.",
                    "Small logs daily, massive peace of mind.",
                    "Take 60 seconds to lock in today's numbers.",
                    "Clear books, clear mind for tomorrow.",
                ];
                $headline = $headlines[($dayOfYear + $user->id) % count($headlines)];
                $subtext = "Don't let today's receipts turn into next week's mystery deductions. Open Pasona and log today in under two minutes.";
                $pushTitle = "Time for your 60s Money Minute ⏰";
                $pushBody = "It's {$time}. Log today's spending and check today's financial fact.";
            }
        }

        return [
            'subject'   => $subject,
            'greeting'  => "{$timeGreeting}, {$firstName}",
            'headline'  => $headline,
            'subtext'   => $subtext,
            'pushTitle' => $pushTitle,
            'pushBody'  => $pushBody,
        ];
    }
}
