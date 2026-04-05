import type { ReactNode } from "react";

type RoutePlaceholderProps = {
  title: string;
  summary: string;
  implementedNow: string[];
  deferredWork: string[];
  children?: ReactNode;
};

export function RoutePlaceholder({
  title,
  summary,
  implementedNow,
  deferredWork,
  children,
}: RoutePlaceholderProps) {
  return (
    <article className="placeholder-card">
      <header className="placeholder-card__header">
        <p className="placeholder-card__eyebrow">Foundation route</p>
        <h2 className="placeholder-card__title">{title}</h2>
        <p className="placeholder-card__summary">{summary}</p>
      </header>
      {children}
      <div className="placeholder-card__columns">
        <section className="placeholder-card__section">
          <h3>Implemented now</h3>
          <ul className="placeholder-card__list">
            {implementedNow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="placeholder-card__section">
          <h3>Deferred downstream work</h3>
          <ul className="placeholder-card__list">
            {deferredWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
