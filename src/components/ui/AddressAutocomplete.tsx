import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const FIND_URL = 'https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/json3.ws';
const RETRIEVE_URL = 'https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Retrieve/v2.11/json3.ws';

export interface VerifiedAddress {
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
}

interface Suggestion {
  Id: string;
  Text: string;
  Description: string;
  Next: 'Find' | 'Retrieve';
}

interface Props {
  apiKey: string;
  value: string;
  onChange: (text: string) => void;
  onVerified: (address: VerifiedAddress | null) => void;
  verified: boolean;
  id?: string;
  invalid?: boolean;
}

// Canada Post AddressComplete Find/Retrieve. Typing clears verification; only picking
// a suggestion (and a successful Retrieve) marks the address as verified.
export function AddressAutocomplete({ apiKey, value, onChange, onVerified, verified, id, invalid }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const lastId = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const requestSeq = useRef(0);

  const find = async (term: string, containerId = '') => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        Key: apiKey, SearchTerm: term, LastId: containerId, Country: 'CA',
        LanguagePreference: 'en', MaxSuggestions: '7',
      });
      const res = await fetch(`${FIND_URL}?${params}`);
      const data = await res.json();
      if (seq !== requestSeq.current) return;
      const items: (Suggestion & { Error?: string })[] = data.Items || [];
      if (items[0]?.Error) throw new Error('lookup');
      setSuggestions(items);
      setActive(-1);
      setOpen(items.length > 0);
    } catch {
      if (seq === requestSeq.current) {
        setSuggestions([]);
        setOpen(false);
        setError('Address lookup is unavailable right now. Please try again shortly.');
      }
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  };

  const retrieve = async (item: Suggestion) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${RETRIEVE_URL}?${new URLSearchParams({ Key: apiKey, Id: item.Id })}`);
      const data = await res.json();
      const r = data.Items?.[0];
      if (!r || r.Error) throw new Error('retrieve');
      // Unit is collected separately, so use the civic address without a suite prefix
      const street = [r.BuildingNumber, r.Street].filter(Boolean).join(' ') || r.Line1;
      onChange(street);
      onVerified({ streetAddress: street, city: r.City, province: r.ProvinceCode, postalCode: r.PostalCode });
      setOpen(false);
      setSuggestions([]);
    } catch {
      setError('Could not load that address. Please try another.');
      onVerified(null);
    } finally {
      setLoading(false);
    }
  };

  const select = (item: Suggestion) => {
    if (item.Next === 'Retrieve') {
      retrieve(item);
    } else {
      lastId.current = item.Id;
      find(value, item.Id);
    }
  };

  const handleInput = (text: string) => {
    onChange(text);
    onVerified(null);
    lastId.current = '';
    clearTimeout(timer.current);
    if (text.trim().length < 3) {
      requestSeq.current++;
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => find(text), 250);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); select(suggestions[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Start typing your street address"
        autoComplete="off"
        autoCorrect="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-invalid={invalid}
        className={cn('h-12 text-base pr-10', verified && 'border-green-600')}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          : verified ? <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Address verified" />
          : null}
      </div>
      {open && (
        <ul role="listbox" className="absolute z-50 mt-1 w-full max-h-72 overflow-auto rounded-md border bg-background shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={s.Id}
              role="option"
              aria-selected={i === active}
              // mousedown fires before the input's blur, so the selection isn't lost
              onMouseDown={(e) => { e.preventDefault(); select(s); }}
              className={cn('flex items-start gap-2 px-3 py-3 cursor-pointer text-sm', i === active && 'bg-muted')}
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>
                <span className="block font-medium">{s.Text}</span>
                <span className="block text-muted-foreground">{s.Description}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
