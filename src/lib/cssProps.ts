import type { CSSProperties } from 'react';

export function cssProps(props: Record<string, string | number | undefined>): CSSProperties {
  return props as CSSProperties;
}
