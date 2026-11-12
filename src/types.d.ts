export type OS = 'windows' | 'macos' | 'ipados';
export type Connection = 'bluetooth' | 'receiver' | 'wired';
export interface Evidence<T> { value: T | null; source: string | null; note: string; }
export interface Source { id: string; title: string; url: string; checkedAt: string; section: string; }
export interface Product {
  id: string; brand: string; name: string; variant: string; region: string; summary: string;
  sources: Source[];
  facts: {
    connections: Evidence<Connection[]>; numpad: Evidence<boolean>; os: Evidence<OS[]>;
    multiDevice: Evidence<boolean>; power: Evidence<'battery' | 'rechargeable'>;
    profile: Evidence<'low' | 'standard'>; width: Evidence<number>; weight: Evidence<number>;
    receiverIncluded: Evidence<boolean>; backlight: Evidence<boolean>; mechanism: Evidence<string>;
    priceKrw: Evidence<number>; noiseDb: Evidence<number>;
  };
  caveats: string[];
}
export interface Answers {
  os: OS; connection: 'any' | Connection; numpad: 'any' | 'yes' | 'no';
  devices: 'one' | 'multi'; priority: 'compact' | 'rechargeable' | 'low' | 'balanced';
  noise: 'normal' | 'strict'; budget: 'none' | '50000' | '100000' | '200000';
}
export interface Assessment {
  product: Product; status: 'match' | 'excluded' | 'unknown'; score: number;
  reasons: { text: string; field: keyof Product['facts'] }[]; blockers: string[]; warnings: string[];
}
export interface Session { version: 1; answers: Answers; step: number; finished: boolean; }
