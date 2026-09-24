export interface MoneyFact {
  category: string;
  title: string;
  fact: string;
  take: string;
}

export const MONEY_FACTS: MoneyFact[] = [
  {
    category: "Behavioral Quirks",
    title: "The Diderot Effect",
    fact: "Denis Diderot was gifted a scarlet dressing gown. Suddenly, all his other furniture looked shoddy by comparison, driving him into debt replacing everything.",
    take: 'Be mindful of "upgrade cascades" where one new purchase triggers five unplanned others.',
  },
  {
    category: "Wealth Habits",
    title: "The 72-Hour Rule for Impulse Buys",
    fact: "Studies show dopamine spikes during the anticipation of buying, not the owning. Waiting 72 hours drops impulse purchase rates by over 60%.",
    take: "Put items in your cart and sleep on them for 3 days. If you still want it, it's intentional.",
  },
  {
    category: "Investing & Math",
    title: "The Rule of 72",
    fact: "Divide 72 by your annual interest rate to find roughly how many years it takes for your money to double (e.g. 72 / 12% = 6 years).",
    take: "Compound interest works slowly at first, then exponentially. Time in the market is your greatest asset.",
  },
  {
    category: "Psychology",
    title: "Mental Accounting Trap",
    fact: 'People treat "unexpected money" (tax refunds, gifts, bonuses) with less discipline than their hard-earned paycheck, spending it faster on luxuries.',
    take: "All money is fungible. Treat unexpected money with the same care as your regular salary.",
  },
  {
    category: "Budgeting",
    title: 'The "Latte Factor" Myth vs Reality',
    fact: "Cutting small daily coffees rarely builds wealth on its own; high-impact wealth comes from optimizing your big 3: Housing, Transport, and Food.",
    take: "Control your major recurring expenses first, then enjoy guilt-free small pleasures that bring real joy.",
  },
  {
    category: "Psychology",
    title: "Anchoring Bias in Pricing",
    fact: 'When a store shows a "Was ₦100,000, Now ₦60,000" tag, your brain anchors to the ₦100,000 instead of asking if the item is truly worth ₦60,000 to you.',
    take: 'Ignore the "discount" figure. Ask yourself: "Would I pay this exact price if there were no sale tag?"',
  },
  {
    category: "Behavioral Quirks",
    title: "Lifestyle Creep",
    fact: 'As people earn more, former "luxuries" quietly turn into "necessities". Without tracking, expenses expand to consume 100% of any income bump.',
    take: "Every time you get a raise, automate sending at least 50% of the raise straight to savings before touching the rest.",
  },
  {
    category: "Financial History",
    title: "The First Paper Money",
    fact: "Paper money was invented in China during the Tang Dynasty (7th century) because merchant copper coins were too heavy to transport along the Silk Road.",
    take: "Money is fundamentally a tool for trust and convenience. Track it simply so it serves your goals.",
  },
  {
    category: "Behavioral Quirks",
    title: "The Sunk Cost Fallacy",
    fact: "People continue investing time or money into bad ventures (or unused subscriptions) simply because they already poured funds into them.",
    take: "Money spent in the past is gone. Base today's financial decisions solely on future value.",
  },
  {
    category: "Wealth Habits",
    title: "Pay Yourself First",
    fact: 'Saving "whatever is left over at month-end" yields up to 70% less accumulated wealth than routing a fixed amount to savings immediately on payday.',
    take: "Automate savings on the 1st of the month. Live comfortably on what remains.",
  },
  {
    category: "Investing & Math",
    title: "Inflation is a Silent Tax",
    fact: "At a 15% annual inflation rate, cash kept under a mattress or in a zero-interest account loses half its purchasing power in under 5 years.",
    take: "Keep emergency funds liquid, but put surplus capital into inflation-beating assets or high-yield vehicles.",
  },
  {
    category: "Psychology",
    title: "Loss Aversion",
    fact: "Psychological research proves the pain of losing money feels twice as intense as the joy of gaining the same amount.",
    take: "Don't let the fear of short-term losses keep you from long-term investing opportunities.",
  },
  {
    category: "Budgeting",
    title: "The 50/30/20 Guideline",
    fact: "Popularized by Elizabeth Warren, this rule splits take-home income into 50% Needs, 30% Wants, and 20% Savings/Debt Repayment.",
    take: "You don't need penny-by-penny restrictions — just broad boundaries that keep your future secure.",
  },
  {
    category: "Psychology",
    title: "Cashless Effect (The Invisible Spend)",
    fact: "People spend an average of 12% to 18% more when tapping cards or digital transfers compared to handing over physical cash.",
    take: "Digital payments reduce friction so much that logging transactions daily is the ultimate antidote.",
  },
  {
    category: "Wealth Habits",
    title: "The 1% Micro-Improvement",
    fact: "Increasing your savings rate by just 1% every 3 months feels painless, but compounds into thousands over a decade.",
    take: "Start tiny. Micro-habits beat unsustainable radical overhauls every single time.",
  },
  {
    category: "Fun Facts",
    title: 'The Origin of "Bankrupt"',
    fact: 'The word "bankrupt" comes from the Italian "banca rotta" (broken bench). In medieval Italy, if a banker couldn\'t pay debts, their trading bench was smashed.',
    take: "Thankfully today, good bookkeeping on Pasona keeps all your benches intact!",
  },
  {
    category: "Wealth Habits",
    title: "Emergency Fund Milestone",
    fact: "Having just 1 month of living expenses saved eliminates over 50% of financial stress reported in global wellness surveys.",
    take: "Before aiming for 6 months, celebrate hitting your first full month of living expenses safely stashed away.",
  },
  {
    category: "Behavioral Quirks",
    title: "Present Bias",
    fact: "Human brains are wired to prioritize immediate gratification today over benefits for our future selves 10 years from now.",
    take: "Make saving effortless and automatic so your present self doesn't have to make hard choices daily.",
  },
  {
    category: "Investing & Math",
    title: "The Cost of Waiting",
    fact: "Someone who invests consistently from age 25 to 35 and stops will often have more money at 60 than someone who starts at 35 and invests for 25 years straight.",
    take: "Early consistency beats late intensity.",
  },
  {
    category: "Wealth Habits",
    title: "Subscription Creep Audit",
    fact: "The average consumer underestimates their monthly subscription costs by more than 2.5x due to recurring micro-debits.",
    take: "Audit your bank feeds once a quarter to cancel recurring services you haven't used in the last 30 days.",
  },
  {
    category: "Behavioral Quirks",
    title: "The Decoy Effect",
    fact: 'Pricing a "Medium" at ₦2,800 and "Large" at ₦3,000 makes the Large feel like a steal — nudging you to spend more than the ₦1,500 Small you intended.',
    take: 'Spot decoys in menus and shopping carts. Buy what you actually need, not the "best relative deal".',
  },
  {
    category: "Budgeting",
    title: "Zero-Based Budgeting",
    fact: "Assigning every single currency unit a specific job (savings, bills, fun) before the month starts prevents money from mysteriously leaking away.",
    take: "Unallocated money is the first money to disappear.",
  },
  {
    category: "Financial History",
    title: 'The Origin of "Salary"',
    fact: 'The word "salary" originates from the Latin "salarium", referring to money given to Roman soldiers to purchase salt — a precious preservative.',
    take: "Your salary is your primary wealth-building tool. Preserve and allocate it with intention.",
  },
  {
    category: "Psychology",
    title: 'Social Comparison & "Keeping Up"',
    fact: "Over 70% of people who buy luxury consumer items report doing so to signal status to peers rather than personal utility.",
    take: "True wealth is what you don't see — the unspent assets and freedom in your accounts.",
  },
  {
    category: "Wealth Habits",
    title: "The Power of Friction",
    fact: "Removing saved card details from online shopping apps creates a 20-second barrier that stops 40% of mindless midnight purchases.",
    take: "Add friction to bad habits (spending) and remove friction from good habits (logging transactions).",
  },
  {
    category: "Investing & Math",
    title: "Diversification is Free Insurance",
    fact: 'Nobel laureate Harry Markowitz famously called diversification the only "free lunch" in finance because it lowers risk without lowering expected return.',
    take: "Never put all your eggs in one basket — spread across varied assets and stable accounts.",
  },
];

function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Returns a deterministic daily money fact based on day of year.
 * Rotates smoothly so each day brings a new insight.
 */
export function getDailyMoneyFact(date: Date = new Date(), userSeed = 0): MoneyFact {
  const dayOfYear = getDayOfYear(date);
  const index = Math.abs(dayOfYear + userSeed * 17) % MONEY_FACTS.length;
  return MONEY_FACTS[index] ?? MONEY_FACTS[0]!;
}

/**
 * Returns a random money fact from the catalog.
 */
export function getRandomMoneyFact(): MoneyFact {
  const index = Math.floor(Math.random() * MONEY_FACTS.length);
  return MONEY_FACTS[index] ?? MONEY_FACTS[0]!;
}
