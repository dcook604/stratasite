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

  useEffect(() => {
    fetchTurnstileKey().then(setSiteKey);
  }, []);

  if (!siteKey) return null;

  return <Turnstile siteKey={siteKey} {...props} />;
}
