// Rich notification content catalog for Pasona Finance mobile app.
//
// Supports 3 distinct notification channels:
// 1. Morning Financial Wisdom (Money facts, cognitive biases, timeless quotes) - Informative, no heavy CTA
// 2. Afternoon App Capabilities & Progress (Feature discovery, habits, streak milestones) - Informative, no heavy CTA
// 3. Evening Transaction Reminder (Actionable reminder timed to user preference) - Carries the explicit CTA

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

// 1. Morning Financial Wisdom (Facts & Quotes) - Informative
export const FINANCIAL_WISDOM_CATALOG: FinancialWisdomItem[] = [
  {
    id: "quote-buffett-saving",
    type: "quote",
    title: "The Golden Rule of Saving",
    content: "Do not save what is left after spending, but spend what is left after saving.",
    author: "Warren Buffett",
    takeaway: "Automate sending funds to savings or investments immediately on payday.",
    category: "Wealth Habits",
  },
  {
    id: "fact-diderot-effect",
    type: "fact",
    title: "The Diderot Effect",
    content: "Denis Diderot received a luxurious gown, which made his other furniture look cheap, driving him to spend a fortune replacing everything.",
    takeaway: "Beware of 'upgrade cascades' where one purchase triggers multiple unplanned ones.",
    category: "Behavioral Quirks",
  },
  {
    id: "quote-munger-consistency",
    type: "quote",
    title: "The Power of Incremental Wisdom",
    content: "Spend each day trying to be a little wiser than you were when you woke up. Discharge your duties faithfully and well.",
    author: "Charlie Munger",
    takeaway: "Small daily habits compound into massive financial independence over time.",
    category: "Mindset",
  },
  {
    id: "fact-rule-of-72",
    type: "fact",
    title: "The Rule of 72",
    content: "Divide 72 by your annual interest rate to estimate how many years it takes for your investment to double.",
    takeaway: "Compound growth works slowly at first, then exponentially. Time is your greatest asset.",
    category: "Investing & Math",
  },
  {
    id: "quote-housel-wealth",
    type: "quote",
    title: "True Wealth is Invisible",
    content: "Wealth is what you don't see. It's the cars not purchased, the watches not worn, the first-class upgrades declined.",
    author: "Morgan Housel",
    takeaway: "Focus on accumulated assets and financial freedom rather than display items.",
    category: "Psychology",
  },
  {
    id: "fact-cashless-effect",
    type: "fact",
    title: "The Cashless Effect",
    content: "Studies show consumers spend 12% to 18% more when tapping cards or transfers compared to paying physical cash.",
    takeaway: "Digital payments reduce friction so much that daily logging is the ultimate defense.",
    category: "Behavioral Quirks",
  },
  {
    id: "quote-franklin-leaks",
    type: "quote",
    title: "Guard Against Little Leaks",
    content: "Beware of little expenses; a small leak will sink a great ship.",
    author: "Benjamin Franklin",
    takeaway: "Micro-subscriptions and daily incidental spends quietly erode your savings rate.",
    category: "Budgeting",
  },
  {
    id: "fact-72-hour-rule",
    type: "fact",
    title: "The 72-Hour Rule",
    content: "Dopamine peaks during the anticipation of buying, not owning. Waiting 72 hours slashes impulse purchases by over 60%.",
    takeaway: "Leave unplanned items in your cart for 3 days before finalizing.",
    category: "Wealth Habits",
  },
  {
    id: "quote-ramsey-peace",
    type: "quote",
    title: "Financial Peace vs Stuff",
    content: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
    author: "Dave Ramsey",
    takeaway: "Keeping your living expenses comfortably below income unlocks true freedom.",
    category: "Wealth Habits",
  },
  {
    id: "fact-mental-accounting",
    type: "fact",
    title: "Mental Accounting Trap",
    content: "People tend to spend unexpected bonuses or gifts much faster on luxuries than their regular paycheck.",
    takeaway: "All money is fungible. Treat unexpected windfalls with the same care as hard-earned wages.",
    category: "Psychology",
  },
  {
    id: "quote-naval-freedom",
    type: "quote",
    title: "Freedom Over Luxury",
    content: "The real measure of wealth is how much freedom you have, not how much stuff you own.",
    author: "Naval Ravikant",
    takeaway: "Every dollar saved is a unit of future autonomy and peace of mind.",
    category: "Mindset",
  },
  {
    id: "fact-zero-based",
    type: "fact",
    title: "Zero-Based Allocation",
    content: "Giving every unit of income a job (savings, bills, discretionary) prevents cash from mysteriously leaking away.",
    takeaway: "Unallocated funds are almost always the first to disappear.",
    category: "Budgeting",
  },
  {
    id: "quote-seneca-wealth",
    type: "quote",
    title: "Sufficiency is Great Wealth",
    content: "It is not the man who has too little, but the man who craves more, that is poor.",
    author: "Seneca",
    takeaway: "Contentment with your standard of living puts you ahead of 90% of consumers.",
    category: "Mindset",
  },
  {
    id: "fact-subscription-creep",
    type: "fact",
    title: "Subscription Creep",
    content: "The average person underestimates their monthly subscription costs by 2.5x due to automated recurring micro-debits.",
    takeaway: "Audit your bank statements quarterly to cancel services you rarely open.",
    category: "Wealth Habits",
  },
];

// 2. Afternoon App Capabilities & Progress - Informative feature spotlight
export const APP_CAPABILITIES_CATALOG: AppCapabilityItem[] = [
  {
    id: "feature-category-budgets",
    title: "Category Budgets",
    summary: "Set monthly spending limits for categories like Food and Shopping to stay within your targets.",
    description: "Navigate to Categories to set spending thresholds. Pasona tracks your progress so you never exceed your comfort zone.",
    route: "/categories",
    category: "feature",
  },
  {
    id: "feature-multi-account",
    title: "Multi-Account Tracking",
    summary: "Unify your bank accounts, mobile money wallets, and cash reserves in one net worth dashboard.",
    description: "Manage different accounts under the Accounts tab. Each account tracks starting balances and live cash flows accurately.",
    route: "/accounts",
    category: "feature",
  },
  {
    id: "feature-privacy-mode",
    title: "Discreet Privacy Mode",
    summary: "Checking finances in a public space? Tap the eye icon on the Dashboard to blur all sensitive balances.",
    description: "Privacy mode keeps your balances hidden while still allowing you to view and log transactions freely.",
    route: "/dashboard",
    category: "feature",
  },
  {
    id: "feature-statement-import",
    title: "Bank Statement Import",
    summary: "Save time by uploading CSV bank statements with automatic duplicate detection.",
    description: "Head over to the Import page to parse statements, preview transactions, and bulk-import without duplicate entries.",
    route: "/import",
    category: "feature",
  },
  {
    id: "feature-offline-sync",
    title: "Offline-First Logging",
    summary: "No internet connection? Log your transactions anytime and Pasona syncs automatically when reconnected.",
    description: "Your transactions are queued safely in your device storage and synchronized seamlessly once network is restored.",
    route: "/transactions",
    category: "feature",
  },
  {
    id: "feature-clean-transfers",
    title: "Clean Account Transfers",
    summary: "Move money between your own accounts without distorting your income or expense metrics.",
    description: "Select Transfer when logging a move between Bank and Cash. It keeps account balances accurate without skewing monthly spend.",
    route: "/transactions/add",
    category: "feature",
  },
  {
    id: "feature-cashflow-analytics",
    title: "Monthly Cash Flow Analysis",
    summary: "Review your total Income vs Expenses on the Dashboard to measure your true monthly savings rate.",
    description: "A quick glance at your monthly overview shows exactly how much of your hard-earned money remains preserved.",
    route: "/dashboard",
    category: "progress",
  },
  {
    id: "feature-biometric-unlock",
    title: "Instant Biometric Security",
    summary: "Enable Fingerprint or Face ID in Settings for lightning-fast and secure access.",
    description: "Protect your personal financial records while eliminating the friction of typing passwords on every session.",
    route: "/settings",
    category: "feature",
  },
  {
    id: "feature-data-export",
    title: "Export to CSV & Excel",
    summary: "Export your complete transaction history anytime for personal backups or tax filing.",
    description: "Under Settings, download your records in CSV format for analysis in Excel, Google Sheets, or tax software.",
    route: "/settings",
    category: "feature",
  },
  {
    id: "feature-custom-categories",
    title: "Personalized Categories",
    summary: "Customize category names and icons in Settings to match your exact lifestyle and spending patterns.",
    description: "Tailor your financial tracking system to your life by organizing expenses into groups that make sense to you.",
    route: "/categories",
    category: "feature",
  },
  {
    id: "habit-daily-streak",
    title: "Daily Logging Consistency",
    summary: "Taking 60 seconds each evening to record transactions eliminates weekend receipt anxiety.",
    description: "Consistency turns financial tracking from a chore into a superpower. Watch your financial confidence grow.",
    route: "/dashboard",
    category: "habit",
  },
];

function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * 1. Morning Financial Wisdom (Informative, No CTA)
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
    ? `💬 Financial Wisdom: ${item.author ?? "Quote"}` 
    : `💡 Money Fact: ${item.title}`;

  const body = item.type === "quote" 
    ? `"${item.content}" — ${item.author ?? ""}` 
    : item.content;

  const largeBody = `${body}\n\n💡 Reflection: ${item.takeaway}`;

  return { title, body, largeBody, item };
}

/**
 * 2. Afternoon App Capability & Progress (Informative, No heavy CTA)
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

  let title = `✨ App Spotlight: ${item.title}`;
  let body = item.summary;
  let largeBody = `${item.summary}\n\n${item.description}`;

  // If user has an active streak, highlight their progress
  if (streak >= 2 && index % 2 === 0) {
    title = `🔥 Progress: ${streak}-Day Logging Streak`;
    body = `You've maintained your tracking streak for ${streak} consecutive days. Consistency builds wealth!`;
    largeBody = `You're on a ${streak}-day logging streak! Regular awareness of your finances transforms money management into effortless habit.\n\nTip: ${item.summary}`;
  }

  return { title, body, largeBody, item };
}

/**
 * 3. Evening Reminder (Actionable, Carries the CTA)
 */
export function getDailyReminder(reminderTime: string, streak = 0): ReminderCopy {
  if (streak >= 2) {
    return {
      title: `🔥 Keep Your ${streak}-Day Streak Alive!`,
      body: `It's ${reminderTime}. Tap to log today's transactions and keep your streak going!`,
      largeBody: `It's ${reminderTime}. Don't let your ${streak}-day logging streak break. Take 60 seconds to review today's expenses and balance your books.\n\nTap to log your transactions now!`,
      route: "/transactions/add",
    };
  }

  return {
    title: "⏰ 60-Second Money Check-in",
    body: `It's ${reminderTime}. Take 60 seconds to log today's spending. Tap to log now!`,
    largeBody: `Clear books, clear mind for tomorrow. Review your day and record any purchases, rides, or meals in under a minute.\n\nTap to log your transactions now!`,
    route: "/transactions/add",
  };
}
