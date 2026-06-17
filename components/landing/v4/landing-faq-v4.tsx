'use client';

import { LandingSection } from '@/components/landing/v4/landing-section';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';

type FaqItemProps = {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  reducedMotion: boolean;
  id: string;
};

function FaqAccordionItem({ question, answer, isOpen, onToggle, reducedMotion, id }: FaqItemProps) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border border-white/5 bg-black/40 transition-colors duration-300',
        'hover:border-[var(--landing-green)]/30 hover:bg-white/[0.04]',
        isOpen && 'border-[var(--landing-green)]/30 bg-white/[0.04]',
      )}
    >
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
      >
        <span className="text-base font-bold text-white sm:text-lg">{question}</span>
        <motion.span
          aria-hidden
          animate={reducedMotion ? undefined : { rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="flex shrink-0 items-center justify-center"
        >
          <Plus className="h-5 w-5 text-[var(--landing-green)]" strokeWidth={2.5} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-trigger`}
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={reducedMotion ? { height: 'auto', opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400 sm:px-6 sm:pb-6 sm:text-base">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

type LandingFaqV4Props = {
  items: Array<{ question: string; answer: string }>;
};

export function LandingFaqV4({ items }: LandingFaqV4Props) {
  const reducedMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  const handleToggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <LandingSection divider aria-labelledby="faq-heading-v4">
      <header className="mx-auto mb-16 max-w-3xl text-center">
        {reducedMotion ? (
          <>
            <p className="text-sm font-mono tracking-widest text-[var(--landing-green-pastel)]">
              RESOLVEMOS TUS DUDAS
            </p>
            <h2 id="faq-heading-v4" className="landing-heading mt-4 text-4xl text-white md:text-5xl">
              Preguntas frecuentes
            </h2>
          </>
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              className="text-sm font-mono tracking-widest text-[var(--landing-green-pastel)]"
            >
              RESOLVEMOS TUS DUDAS
            </motion.p>
            <motion.h2
              id="faq-heading-v4"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.06 }}
              className="landing-heading mt-4 text-4xl text-white md:text-5xl"
            >
              Preguntas frecuentes
            </motion.h2>
          </>
        )}
      </header>

      <div className="mx-auto max-w-3xl space-y-4">
        {items.map((item, index) => (
          <FaqAccordionItem
            key={item.question}
            id={`faq-v4-${index}`}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </LandingSection>
  );
}
