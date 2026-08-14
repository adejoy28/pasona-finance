import { useCallback, useEffect, useState } from "react";
import { Coachmark } from "./Coachmark";
import { completeTour, isTourActive, setTourStep, skipTour } from "@/lib/tour/tour-state";

const TOTAL_STEPS = 3;

type Step = {
  target: string;
  title: string;
  body: React.ReactNode;
  placement: "top" | "bottom" | "left" | "right" | "center";
  primaryLabel: string;
};

const STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to Pasona",
    body: (
      <>
        Track your money across accounts, log what comes in and out, and watch your spending tell a
        story. A quick tour to get you set up.
      </>
    ),
    primaryLabel: "Let's go",
  },
  {
    target: "[data-tour-target='accounts-nav']",
    placement: "top",
    title: "Set up your first account",
    body: (
      <>
        Add the place your money lives — a bank account, mobile wallet, or cash on hand. Every
        transaction you log is tied to one of these.
      </>
    ),
    primaryLabel: "Next",
  },
  {
    target: "[data-tour-target='add-transaction']",
    placement: "top",
    title: "Log your first transaction",
    body: (
      <>
        Tap the blue plus to record income, an expense, or a transfer. You can also log from the
        History page.
      </>
    ),
    primaryLabel: "Start tracking",
  },
];

type OnboardingTourProps = {
  /** When the user has zero accounts, the tour is offered. */
  hasNoAccounts: boolean;
  /** Bypass the "no accounts" gate. Used by Settings → "Replay tour". */
  force?: boolean;
};

export function OnboardingTour({ hasNoAccounts, force = false }: OnboardingTourProps) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // The tour auto-starts when:
    //  - the user has no accounts (a strong "I'm new" signal), AND
    //  - they haven't completed or dismissed the tour before, OR
    //  - the caller passed `force` (e.g. Replay from Settings).
    if (typeof window === "undefined") return;
    if (!force && !hasNoAccounts) {
      setActive(false);
      return;
    }
    if (!isTourActive()) return;
    // Defer one frame so the targets have time to mount.
    const t = setTimeout(() => setActive(true), 250);
    return () => clearTimeout(t);
  }, [hasNoAccounts, force]);

  const advance = useCallback(() => {
    const next = step + 1;
    if (next >= TOTAL_STEPS) {
      completeTour();
      setActive(false);
      return;
    }
    setStep(next);
    setTourStep(next);
  }, [step]);

  const back = useCallback(() => {
    const prev = Math.max(0, step - 1);
    setStep(prev);
    setTourStep(prev);
  }, [step]);

  const dismiss = useCallback(() => {
    skipTour();
    setActive(false);
  }, []);

  if (!active) return null;
  const current = STEPS[step];
  if (step === 0) {
    return (
      <Coachmark
        open={active}
        target={current.target}
        title={current.title}
        body={current.body}
        step={step}
        totalSteps={TOTAL_STEPS}
        primaryLabel={current.primaryLabel}
        onPrimary={advance}
        onDismiss={dismiss}
        placement={current.placement}
      />
    );
  }
  return (
    <Coachmark
      open={active}
      target={current.target}
      title={current.title}
      body={current.body}
      step={step}
      totalSteps={TOTAL_STEPS}
      primaryLabel={current.primaryLabel}
      secondaryLabel="Back"
      onPrimary={advance}
      onSecondary={back}
      onDismiss={dismiss}
      placement={current.placement}
    />
  );
}
