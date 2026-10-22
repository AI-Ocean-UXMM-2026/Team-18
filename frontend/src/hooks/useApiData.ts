// useApiData — load something from the API, with loading / error / refresh.
import { useCallback, useEffect, useRef, useState } from "react";
export function useApiData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef(loader); ref.current = loader;
  const run = useCallback(async () => {
    setLoading(true);
    try { setData(await ref.current()); setError(null); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } finally { setLoading(false); }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);
  return { data, loading, error, refresh: run, setData };
}
