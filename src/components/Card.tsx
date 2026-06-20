import React, { useId } from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  delay?: number;
  className?: string;
  subtitle?: string;
  subtitleColor?: string;
  iconBgClass?: string;
  iconColorClass?: string;
}

export const Card = React.memo(function Card({ 
  title, 
  icon: Icon, 
  children, 
  delay = 0, 
  className = "bg-white text-primary-text border-border-light",
  subtitle,
  subtitleColor = "text-accent-green",
  iconBgClass = "bg-primary-bg",
  iconColorClass = "text-primary-text"
}: CardProps) {
  const id = useId();
  const titleId = `${id}-title`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-[32px] p-8 flex flex-col justify-between shadow-sm border overflow-hidden ${className}`}
      aria-labelledby={titleId}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          {subtitle && (
            <span className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-2 block ${subtitleColor}`}>
              {subtitle}
            </span>
          )}
          <h2 id={titleId} className="text-2xl font-medium">{title}</h2>
        </div>
        <div className={`p-3 rounded-2xl ${iconBgClass} ${iconColorClass}`} aria-hidden="true">
          <Icon size={24} className="stroke-[1.5]" />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </motion.section>
  );
});
