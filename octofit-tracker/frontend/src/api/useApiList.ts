import { useEffect, useState } from 'react';

type ListState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: T[] };

export function useApiList<T>(load: () => Promise<T[]>): ListState<T> {
  const [state, setState] = useState<ListState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    load()
      .then((items) => {
        if (!Array.isArray(items)) throw new Error('Invalid list response');
        if (active) setState({ status: 'success', items });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => { active = false; };
  }, [load]);

  return state;
}
