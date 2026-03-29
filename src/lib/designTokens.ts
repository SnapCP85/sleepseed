export const COLORS = {
  night:       '#060912',
  nightMid:    '#0B1535',
  nightCard:   '#0C1840',
  nightRaised: '#141a2e',
  amber:       '#F5B84C',
  teal:        '#14d890',
  purple:      '#9A7FD4',
  cream:       '#F4EFE8',
} as const;

export const PALETTE = [
  { bg: 'linear-gradient(145deg,#251838,#140d28)', ac: '#b48cff' },
  { bg: 'linear-gradient(145deg,#122038,#080e24)', ac: '#68b8ff' },
  { bg: 'linear-gradient(145deg,#261c08,#16100a)', ac: '#F5B84C' },
  { bg: 'linear-gradient(145deg,#102418,#081410)', ac: '#5DCAA5' },
  { bg: 'linear-gradient(145deg,#28101e,#180812)', ac: '#ff82b8' },
  { bg: 'linear-gradient(145deg,#240c10,#14080a)', ac: '#ff7878' },
] as const;

export const RADIUS = {
  sm: '14px',
  md: '18px',
  lg: '22px',
} as const;

export const BORDER = {
  hair: '0.5px',
  thin: '1px',
  mid:  '1.5px',
} as const;

export const SP = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
} as const;

export const VARIANT_RGB: Record<string, string> = {
  standard: '154,127,212',
  origin:   '245,184,76',
  journey:  '20,216,144',
  occasion: '148,130,255',
  streak:   '245,184,76',
};
