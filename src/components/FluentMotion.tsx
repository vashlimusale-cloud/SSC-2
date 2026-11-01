import React from 'react';
import { motion, HTMLMotionProps, Variants } from 'motion/react';

/**
 * Windows 11 WinUI 3 / Neo's Noir Motion Tokens
 */
export const FLUENT_SPRING = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

export const FLUENT_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const fluentStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.01,
    },
  },
};

export const fluentStaggerItem: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.994 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: FLUENT_EASE,
    },
  },
};

interface FluentCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  interactive?: boolean;
  accentColor?: 'purple' | 'violet' | 'blue' | 'amber' | 'emerald' | 'cyan' | 'rose' | 'indigo';
  className?: string;
}

const ACCENT_BORDER_MAP: Record<NonNullable<FluentCardProps['accentColor']>, string> = {
  purple: 'rgba(168, 85, 247, 0.42)',
  violet: 'rgba(139, 92, 246, 0.42)',
  blue: 'rgba(56, 189, 248, 0.42)',
  amber: 'rgba(245, 158, 11, 0.42)',
  emerald: 'rgba(16, 185, 129, 0.42)',
  cyan: 'rgba(6, 182, 212, 0.42)',
  rose: 'rgba(239, 68, 68, 0.42)',
  indigo: 'rgba(99, 102, 241, 0.42)',
};

export const FluentCard: React.FC<FluentCardProps> = ({
  children,
  interactive = true,
  accentColor = 'purple',
  className = '',
  ...rest
}) => {
  const hoverBorder = ACCENT_BORDER_MAP[accentColor];

  return (
    <motion.div
      variants={fluentStaggerItem}
      whileHover={
        interactive
          ? {
              y: -2,
              scale: 1.004,
              backgroundColor: '#1d1a20',
              borderColor: hoverBorder,
              boxShadow: '0 14px 32px -6px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(168, 85, 247, 0.08) inset',
            }
          : {
              borderColor: 'rgba(255, 255, 255, 0.13)',
            }
      }
      whileTap={interactive ? { scale: 0.994, y: 0 } : undefined}
      transition={FLUENT_SPRING}
      className={`win-card bg-[#171619] border border-white/[0.07] rounded-2xl ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
