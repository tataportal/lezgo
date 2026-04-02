import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  titleClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  titleClassName = '',
}: SectionHeadingProps) {
  return (
    <div className="ds-v3-section-head">
      {eyebrow ? <div className="ds-v3-eyebrow">{eyebrow}</div> : null}
      <h2 className={`ds-v3-title ds-v3-title--section ${titleClassName}`.trim()}>{title}</h2>
      {body ? <p className="ds-v3-body">{body}</p> : null}
    </div>
  );
}
