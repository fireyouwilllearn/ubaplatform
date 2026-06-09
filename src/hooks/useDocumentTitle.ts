import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `UBA Platform — ${title}`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
