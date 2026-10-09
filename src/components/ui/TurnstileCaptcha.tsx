import { useState, useEffect } from 'react';
import { Turnstile, type TurnstileProps } from '@marsidev/react-turnstile';

let cachedKey: string | null = null;
let fetchPromise: Promise<string> | null = null;

const fetchTurnstileKey = async (): Promise<string> => {
  if (cachedKey) return cachedKey;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch('/api/config/public')
    .then(r => r.json())
    .then(data => {
      cachedKey = data.turnstileSiteKey;
      return cachedKey;
    })
    .catch(() => {
      fetchPromise = null;
      return '';
    });
  return fetchPromise;
};

export function TurnstileCaptcha(props: Omit<TurnstileProps, 'siteKey'>) {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchTurnstileKey().then((key) => {
      setSiteKey(key);
      if (!key) setFailed(true);
    });
  }, []);

  if (failed) {
    return (
      <p role="alert" className="text-sm text-spectrum-red">
        Verification could not load. Please refresh the page, or contact the strata office if it persists.
      </p>
    );
  }

  if (!siteKey) {
    return <p className="text-sm text-on-surface-variant">Loading verification…</p>;
  }

  return <Turnstile siteKey={siteKey} {...props} />;
}
