import type { ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={fadeInVariants}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className, delayChildren = 0 }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={staggerVariants}
      transition={{ delayChildren }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

