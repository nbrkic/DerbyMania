export const FOOTBALL_SPORT_NAMES = ['Fudbal', 'Mali fudbal'];
export const BASKETBALL_SPORT_NAMES = ['Košarka', 'Basket'];

export const FOOTBALL_POSITION_OPTIONS = [
  { value: 'golman', label: 'Golman' },
  { value: 'odbrana', label: 'Odbrana' },
  { value: 'vezni', label: 'Vezni' },
  { value: 'napadac', label: 'Napadač' },
];

export const BASKETBALL_POSITION_OPTIONS = [
  { value: 'plejmejker', label: 'Plejmejker' },
  { value: 'bek', label: 'Bek' },
  { value: 'krilo', label: 'Krilo' },
  { value: 'krilni_centar', label: 'Krilni centar' },
  { value: 'centar', label: 'Centar' },
];

export const FOOTBALL_POSITION_VALUES = FOOTBALL_POSITION_OPTIONS.map((o) => o.value);
export const BASKETBALL_POSITION_VALUES = BASKETBALL_POSITION_OPTIONS.map((o) => o.value);

export const POSITION_LABELS: Record<string, string> = Object.fromEntries(
  [...FOOTBALL_POSITION_OPTIONS, ...BASKETBALL_POSITION_OPTIONS].map((o) => [o.value, o.label])
);

export function sportsToCategories(sportNames: string[]) {
  return {
    football: sportNames.some((n) => FOOTBALL_SPORT_NAMES.includes(n)),
    basketball: sportNames.some((n) => BASKETBALL_SPORT_NAMES.includes(n)),
  };
}
