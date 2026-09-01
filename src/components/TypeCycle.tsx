'use client';

import { useEffect, useState } from 'react';

/**
 * Typewriter that cycles a fixed list of phrases. The phrase list is a compile
 * time constant — nothing user-supplied ever reaches this component.
 */
export default function TypeCycle({ phrases }: { phrases: readonly string[] }) {
  const [index, setIndex] = useState(0);
  // Start already showing the full first phrase, not an empty string — the
  // server-rendered markup (and anything reading it before hydration, like a
  // social-card scraper) should never see a mid-word flash. The effect below
  // treats a full first phrase exactly like it treats reaching the end of any
  // other cycle: hold, then start erasing.
  const [text, setText] = useState(phrases[0] ?? '');
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(phrases[0]);
      return;
    }

    const full = phrases[index % phrases.length];

    if (!erasing && text === full) {
      const hold = setTimeout(() => setErasing(true), 2100);
      return () => clearTimeout(hold);
    }

    if (erasing && text === '') {
      setErasing(false);
      setIndex((i) => (i + 1) % phrases.length);
      return;
    }

    const tick = setTimeout(
      () => setText(erasing ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1)),
      erasing ? 28 : 52,
    );
    return () => clearTimeout(tick);
  }, [text, erasing, index, phrases]);

  return (
    <span className="font-mono text-red-blood">
      {text}
      <span className="animate-blink ml-0.5 inline-block w-[2px] bg-red-blood align-middle" style={{ height: '1em' }} />
    </span>
  );
}
