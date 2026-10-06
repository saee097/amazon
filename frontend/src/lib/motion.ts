import { Variants } from "framer-motion";

export const containerStagger: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
  exit: { opacity: 0 },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: 20 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.96 },
};

export const cardHover: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  whileHover: {
    y: -6,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: { opacity: 0, y: 20 },
};

export const tapScale = {
  whileTap: { scale: 0.95, transition: { duration: 0.1 } },
};

export const buttonHover = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
};
