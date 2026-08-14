import type { Variants, Transition } from "framer-motion";

export const spring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 28,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 24,
};

export const springSnap: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 35,
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const fadeSlideDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const scaleOnTap = { scale: 0.97 };

export const widthGrow: Variants = {
  hidden: { width: 0 },
  visible: (pct: number) => ({
    width: `${pct}%`,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 },
  }),
};

export const cardHover = {
  whileHover: { y: -2, transition: springSoft },
  whileTap: scaleOnTap,
};
