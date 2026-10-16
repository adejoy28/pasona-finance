// Human, non-repetitive notification content catalog for Pasona Finance.
// Clean, natural copy without gimmicky emojis or robotic AI phrasing.

export interface FinancialWisdomItem {
  id: string;
  type: "fact" | "quote";
  title: string;
  content: string;
  author?: string;
  takeaway: string;
  category: string;
}

export interface AppCapabilityItem {
  id: string;
  title: string;
  summary: string;
  description: string;
  route: string;
  category: "feature" | "habit" | "progress";
}

export interface ReminderCopy {
  title: string;
  body: string;
  largeBody: string;
  route: string;
}

// 1. Morning Financial Wisdom (Facts & Quotes) - Informative, clean tone
export const FINANCIAL_WISDOM_CATALOG: FinancialWisdomItem[] = [
  {
    id: "quote-buffett-saving",
    type: "quote",
    title: "Warren Buffett on Saving",
    content: "Do not save what is left after spending, but spend what is left after saving.",
    author: "Warren Buffett",
    takeaway: "Move money into savings or investments right on payday rather than waiting for month-end.",
    category: "Wealth Habits",
  },
  {
    id: "fact-diderot-effect",
    type: "fact",
    title: "The Diderot Effect",
    content: "Denis Diderot was gifted a scarlet dressing gown. Suddenly, all his other furniture looked shoddy by comparison, driving him into debt replacing everything.",
    takeaway: "Be mindful of upgrade cascades where one purchase triggers multiple unplanned ones.",
    category: "Behavioral Quirks",
  },
  {
    id: "quote-munger-consistency",
    type: "quote",
    title: "Charlie Munger on Compounding",
    content: "Spend each day trying to be a little wiser than you were when you woke up. Discharge your duties faithfully and well.",
    author: "Charlie Munger",
    takeaway: "Small daily financial habits compound into independence over time.",
    category: "Mindset",
  },
  {
    id: "fact-rule-of-72",
    type: "fact",
    title: "The Rule of 72",
    content: "Divide 72 by your annual interest rate to estimate how many years it takes for an investment to double.",
    takeaway: "Compound growth starts slow and accelerates exponentially. Time is your greatest asset.",
    category: "Investing & Math",
  },
  {
    id: "quote-housel-wealth",
    type: "quote",
    title: "Morgan Housel on Wealth",
    content: "Wealth is what you don't see. It's the cars not purchased, the watches not worn, the upgrades declined.",
    author: "Morgan Housel",
    takeaway: "Accumulated assets give you autonomy. Display items only display spending.",
    category: "Psychology",
  },
  {
    id: "fact-cashless-effect",
    type: "fact",
    title: "The Cashless Effect",
    content: "Studies show consumers spend 12% to 18% more when tapping cards or phone transfers compared to handing over physical cash.",
    takeaway: "Digital transactions lower payment friction. Logging expenses brings that awareness back.",
    category: "Behavioral Quirks",
  },
  {
    id: "quote-franklin-leaks",
    type: "quote",
    title: "Benjamin Franklin on Small Expenses",
    content: "Beware of little expenses; a small leak will sink a great ship.",
    author: "Benjamin Franklin",
    takeaway: "Recurring subscriptions and everyday incidental spends quietly erode savings rates.",
    category: "Budgeting",
  },
  {
    id: "fact-72-hour-rule",
    type: "fact",
    title: "The 72-Hour Rule",
    content: "Dopamine peaks during the anticipation of buying, not owning. Waiting 72 hours slashes impulse purchases by over 60%.",
    takeaway: "Keep unplanned items in your cart for three days before checking out.",
    category: "Wealth Habits",
  },
  {
    id: "quote-ramsey-peace",
    type: "quote",
    title: "Financial Peace",
    content: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
    author: "Dave Ramsey",
    takeaway: "Maintaining a comfortable gap between income and living costs gives you breathing room.",
    category: "Wealth Habits",
  },
  {
    id: "fact-mental-accounting",
    type: "fact",
    title: "Mental Accounting",
    content: "People tend to treat windfalls, bonuses, and tax refunds with less discipline than their regular paycheck, spending them faster on luxuries.",
    takeaway: "All money has the same value. Treat unexpected windfalls with the same care as regular income.",
    category: "Psychology",
  },
  {
    id: "quote-naval-freedom",
    type: "quote",
    title: "Naval Ravikant on Autonomy",
    content: "The real measure of wealth is how much freedom you have, not how much stuff you own.",
    author: "Naval Ravikant",
    takeaway: "Every saved amount buys you future independence and peace of mind.",
    category: "Mindset",
  },
  {
    id: "fact-zero-based",
    type: "fact",
    title: "Zero-Based Allocation",
    content: "Giving every unit of income a designated purpose before the month begins prevents money from mysteriously leaking away.",
    takeaway: "Unallocated funds in an account are usually the easiest to spend unconsciously.",
    category: "Budgeting",
  },
  {
    id: "quote-seneca-wealth",
    type: "quote",
    title: "Seneca on Contentment",
    content: "It is not the man who has too little, but the man who craves more, that is poor.",
    author: "Seneca",
    takeaway: "Being content with your lifestyle baseline keeps you ahead of lifestyle creep.",
    category: "Mindset",
  },
  {
    id: "fact-subscription-creep",
    type: "fact",
    title: "Subscription Creep",
    content: "The average person underestimates monthly recurring subscriptions by more than 2x due to automatic micro-debits.",
    takeaway: "Review bank statements quarterly to cancel services you rarely open.",
    category: "Wealth Habits",
  },
  {
    id: "fact-latte-factor",
    type: "fact",
    title: "The Big Three Expenses",
    content: "Cutting small coffees rarely builds real wealth on its own. Major financial impact comes from housing, transport, and groceries.",
    takeaway: "Optimize your biggest three recurring expenses first, then enjoy small guilty pleasures freely.",
    category: "Budgeting",
  },
  {
    id: "fact-anchoring-bias",
    type: "fact",
    title: "Price Anchoring",
    content: "When stores show a strike-through discount price, the brain anchors to the higher figure instead of asking if the item is worth the actual selling price.",
    takeaway: "Ask yourself whether you would pay that price if there were no sale tag attached.",
    category: "Psychology",
  },
  {
    id: "fact-lifestyle-creep",
    type: "fact",
    title: "Lifestyle Inflation",
    content: "As income increases, previous luxuries quietly become baseline necessities unless boundaries are set intentionally.",
    takeaway: "When your income grows, route at least half the increase into savings before expanding lifestyle expenses.",
    category: "Behavioral Quirks",
  },
  {
    id: "fact-sunk-cost",
    type: "fact",
    title: "The Sunk Cost Fallacy",
    content: "People often keep spending time or money on poor choices simply because they have already invested into them.",
    takeaway: "Money spent in the past is gone. Make financial decisions based strictly on future value.",
    category: "Psychology",
  },
  {
    id: "fact-loss-aversion",
    type: "fact",
    title: "Loss Aversion",
    content: "Psychological research demonstrates that the pain of losing money feels roughly twice as intense as the joy of gaining the same amount.",
    takeaway: "Acknowledge emotional reactions to market dips so you do not make impulsive long-term decisions.",
    category: "Psychology",
  },
  {
    id: "fact-50-30-20",
    type: "fact",
    title: "The 50/30/20 Rule",
    content: "A simple benchmark splitting take-home pay into 50% needs, 30% wants, and 20% savings or debt repayment.",
    takeaway: "You do not need complicated tracking—clear broad guidelines give you peace of mind.",
    category: "Budgeting",
  },
  {
    id: "fact-emergency-fund",
    type: "fact",
    title: "Emergency Reserves",
    content: "Maintaining three to six months of living expenses in an accessible account prevents taking on high-interest debt when unexpected costs hit.",
    takeaway: "An emergency fund is not an investment—it is personal insurance against life surprises.",
    category: "Wealth Habits",
  },
  {
    id: "quote-marks-risk",
    type: "quote",
    title: "Howard Marks on Risk",
    content: "Risk means more things can happen than will happen.",
    author: "Howard Marks",
    takeaway: "Always maintain financial buffers so an unexpected event does not derail your plan.",
    category: "Investing & Math",
  },
  {
    id: "fact-frictionless-spending",
    type: "fact",
    title: "Adding Friction to Spending",
    content: "Removing saved credit card numbers from shopping websites introduces just enough hesitation to cancel impulse buys.",
    takeaway: "Add one extra step between wanting to buy something and confirming the payment.",
    category: "Wealth Habits",
  },
  {
    id: "quote-lynch-simplicity",
    type: "quote",
    title: "Peter Lynch on Simplicity",
    content: "Never invest in any idea you can't illustrate with a crayon.",
    author: "Peter Lynch",
    takeaway: "If an investment or financial product is too complex to explain simply, step back.",
    category: "Investing & Math",
  },
];

// 2. Afternoon App Capabilities & Tips - Feature insights, no AI cheerleading
export const APP_CAPABILITIES_CATALOG: AppCapabilityItem[] = [
  {
    id: "feature-category-budgets",
    title: "Category Budgets",
    summary: "Set monthly spending limits on groceries, dining, or shopping to stay on track.",
    description: "Navigate to Categories to set spending thresholds. Pasona highlights when categories approach their limit.",
    route: "/categories",
    category: "feature",
  },
  {
    id: "feature-multi-account",
    title: "Multi-Account Balances",
    summary: "Track bank accounts, mobile money, and physical cash together in one place.",
    description: "Manage multiple accounts under Accounts. Each account keeps its own balance and transaction ledger.",
    route: "/accounts",
    category: "feature",
  },
  {
    id: "feature-privacy-mode",
    title: "Privacy Blur",
    summary: "Checking numbers in public? Use the eye icon on Dashboard to blur sensitive balances.",
    description: "Privacy mode masks your exact account balances while still letting you view and log transactions freely.",
    route: "/dashboard",
    category: "feature",
  },
  {
    id: "feature-statement-import",
    title: "Statement Import",
    summary: "Upload CSV statements from your bank with automatic duplicate detection.",
    description: "Head to the Import page to parse bank statements, preview rows, and bulk-import transactions cleanly.",
    route: "/import",
    category: "feature",
  },
  {
    id: "feature-offline-sync",
    title: "Offline Logging",
    summary: "No internet connection? Log expenses now and they sync automatically when reconnected.",
    description: "Transactions are stored safely on your device and synchronized as soon as your connection returns.",
    route: "/transactions",
    category: "feature",
  },
  {
    id: "feature-clean-transfers",
    title: "Account Transfers",
    summary: "Move money between your accounts without skewing monthly expense numbers.",
    description: "Select Transfer when recording a shift between Bank and Cash. It adjusts balances without counting as spending.",
    route: "/transactions/add",
    category: "feature",
  },
  {
    id: "feature-cashflow-analytics",
    title: "Cash Flow Overview",
    summary: "Review total income versus expenses on the Dashboard to measure your monthly savings rate.",
    description: "A quick look at your monthly summary shows how much of your income is remaining.",
    route: "/dashboard",
    category: "progress",
  },
  {
    id: "feature-biometric-unlock",
    title: "Biometric Sign-In",
    summary: "Enable Fingerprint or Face unlock in Settings for fast, secure access.",
    description: "Protect your personal financial records without having to type your password every session.",
    route: "/settings",
    category: "feature",
  },
  {
    id: "feature-data-export",
    title: "Export to CSV",
    summary: "Export your complete transaction history anytime for personal backups or spreadsheets.",
    description: "Download all transaction records from Settings in CSV format for analysis in Excel or Google Sheets.",
    route: "/settings",
    category: "feature",
  },
  {
    id: "feature-custom-categories",
    title: "Custom Categories",
    summary: "Create custom categories and icons that match your real-life spending habits.",
    description: "Customize expense groups in Categories so your breakdown matches how you actually spend.",
    route: "/categories",
    category: "feature",
  },
];

// 3. Evening Reminder Copy Catalog - Human, natural, varied check-ins
interface EveningReminderTemplate {
  title: (context: { streak: number; dayOfWeek: number; dayOfMonth: number; time: string }) => string;
  body: (context: { streak: number; dayOfWeek: number; dayOfMonth: number; time: string }) => string;
  largeBody: (context: { streak: number; dayOfWeek: number; dayOfMonth: number; time: string }) => string;
}

const EVENING_TEMPLATES: EveningReminderTemplate[] = [
  // General check-ins
  {
    title: () => "Daily spending check",
    body: ({ time }) => `Take 30 seconds to log today's expenses before closing out your day.`,
    largeBody: () => `Review any purchases, rides, or transfers from today. Keeping balances accurate takes less than a minute.`,
  },
  {
    title: () => "Log today's transactions",
    body: () => "Any card taps, cash spends, or bank transfers today? Record them now.",
    largeBody: () => "A quick check-in now prevents missing expenses at the end of the month.",
  },
  {
    title: () => "Evening balance check",
    body: () => "Keep your accounts up to date. Tap to log today's spending.",
    largeBody: () => "Review your transactions for the day so your balances stay accurate across all accounts.",
  },
  {
    title: () => "Quick financial check-in",
    body: () => "Did you make any purchases today? Take a moment to log them.",
    largeBody: () => "Staying on top of your daily spending keeps your monthly budget clear and predictable.",
  },
  {
    title: () => "End of day check-in",
    body: () => "Record any expenses from today to keep your books balanced.",
    largeBody: () => "Take 30 seconds to enter any meals, transit, or shopping from today.",
  },
  {
    title: () => "Keep your records current",
    body: () => "Tap to enter today's expenses and keep your cash flow accurate.",
    largeBody: () => "Logging expenses while they are fresh in mind is the easiest way to stay organized.",
  },
  {
    title: () => "Daily spending log",
    body: () => "Take 30 seconds to record any purchases before you wrap up today.",
    largeBody: () => "Clear records today mean fewer surprises when reviewing your monthly statements.",
  },

  // Friday / Weekend variations
  {
    title: ({ dayOfWeek }) => dayOfWeek === 5 ? "Friday wrap-up" : "Weekend check-in",
    body: ({ dayOfWeek }) => dayOfWeek === 5
      ? "Wrap up your week with clean numbers. Record any Friday spending."
      : "Take 30 seconds to record any weekend purchases.",
    largeBody: () => "Review outings, groceries, or transfers so your balances stay accurate heading into next week.",
  },
  {
    title: ({ dayOfWeek }) => dayOfWeek === 0 ? "Sunday review" : "Weekend spending check",
    body: ({ dayOfWeek }) => dayOfWeek === 0
      ? "Get ready for the week ahead with updated account balances."
      : "Log today's weekend expenses in under a minute.",
    largeBody: () => "Starting the new week with balanced accounts makes financial planning effortless.",
  },

  // Midweek variations
  {
    title: () => "Midweek check-in",
    body: () => "Keep your accounts updated. Log any purchases from today.",
    largeBody: () => "Consistent tracking during the week makes monthly reconciliation take zero effort.",
  },

  // Month-end variations
  {
    title: ({ dayOfMonth }) => dayOfMonth >= 28 ? "Month-end wrap" : "Daily check-in",
    body: ({ dayOfMonth }) => dayOfMonth >= 28
      ? "Review your final expenses for the month to see your total savings."
      : "Log any expenses from today to keep your accounts accurate.",
    largeBody: () => "Finish the month with clear books and an accurate picture of your net cash flow.",
  },
];

function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * 1. Morning Financial Wisdom (Clean, no smileys)
 */
export function getDailyWisdom(date: Date = new Date(), userSeed = 0): {
  title: string;
  body: string;
  largeBody: string;
  item: FinancialWisdomItem;
} {
  const dayOfYear = getDayOfYear(date);
  const index = Math.abs(dayOfYear + userSeed * 17) % FINANCIAL_WISDOM_CATALOG.length;
  const item = FINANCIAL_WISDOM_CATALOG[index] ?? FINANCIAL_WISDOM_CATALOG[0]!;

  const title = item.type === "quote" 
    ? `${item.title}` 
    : item.title;

  const body = item.type === "quote" 
    ? `"${item.content}" — ${item.author ?? ""}` 
    : item.content;

  const largeBody = `${body}\n\nKey Takeaway: ${item.takeaway}`;

  return { title, body, largeBody, item };
}

/**
 * 2. Afternoon App Capability (Clean, no smileys)
 */
export function getDailyCapability(
  date: Date = new Date(),
  userSeed = 0,
  streak = 0
): {
  title: string;
  body: string;
  largeBody: string;
  item: AppCapabilityItem;
} {
  const dayOfYear = getDayOfYear(date);
  const index = Math.abs(dayOfYear + userSeed * 13) % APP_CAPABILITIES_CATALOG.length;
  const item = APP_CAPABILITIES_CATALOG[index] ?? APP_CAPABILITIES_CATALOG[0]!;

  let title = item.title;
  let body = item.summary;
  let largeBody = `${item.summary}\n\n${item.description}`;

  if (streak >= 3 && index % 3 === 0) {
    title = `${streak}-Day Logging Streak`;
    body = `You have logged transactions for ${streak} days in a row. Consistent tracking builds financial clarity.`;
    largeBody = `You have maintained an active ${streak}-day logging streak.\n\nTip: ${item.summary}`;
  }

  return { title, body, largeBody, item };
}

/**
 * 3. Evening Reminder (Rotates daily with diverse, human copy)
 */
export function getDailyReminder(
  reminderTime: string,
  streak = 0,
  date: Date = new Date(),
  userSeed = 0
): ReminderCopy {
  const dayOfYear = getDayOfYear(date);
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();

  // Pick template rotating by day of year and seed
  const templateIndex = Math.abs(dayOfYear + userSeed * 7) % EVENING_TEMPLATES.length;
  const template = EVENING_TEMPLATES[templateIndex] ?? EVENING_TEMPLATES[0]!;

  const context = {
    streak,
    dayOfWeek,
    dayOfMonth,
    time: reminderTime,
  };

  // If user has a solid streak, weave it naturally into copy every few days
  if (streak >= 3 && dayOfYear % 3 === 0) {
    return {
      title: `${streak}-Day Streak Active`,
      body: `Log today's spending to keep your ${streak}-day record going.`,
      largeBody: `You have logged your expenses for ${streak} consecutive days. Take 30 seconds to record today's purchases and keep your books updated.`,
      route: "/transactions/add",
    };
  }

  return {
    title: template.title(context),
    body: template.body(context),
    largeBody: template.largeBody(context),
    route: "/transactions/add",
  };
}
