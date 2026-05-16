import { type ThemeConfig, extendTheme } from '@chakra-ui/react'

// OSAI Design System - direct, high-contrast streetwear retail UI.

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const colors = {
  brand: {
    50: '#f7f7f4',
    100: '#ecece5',
    200: '#d9d8cf',
    300: '#b9b7a9',
    400: '#8f8c7c',
    500: '#111111',
    600: '#0d0d0d',
    700: '#090909',
    800: '#050505',
    900: '#000000',
  },
  accent: {
    50: '#fff4ed',
    100: '#ffe4d4',
    200: '#ffc4a8',
    300: '#ff9a70',
    400: '#ff6f3d',
    500: '#f24b22',
    600: '#d73512',
    700: '#ad270f',
    800: '#8b2313',
    900: '#711f12',
  },
  lime: {
    50: '#f8ffe1',
    100: '#edffad',
    200: '#dcff70',
    300: '#c6f934',
    400: '#abe80f',
    500: '#8bc900',
    600: '#6da100',
    700: '#527a05',
    800: '#435f0b',
    900: '#394f0d',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  // Black and white for high contrast
  black: '#000000',
  white: '#ffffff',
}

const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
}

const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
}

const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
}

const sizes = {
  ...space,
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  '8xl': '90rem',
  full: '100%',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content',
}

const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
}

const radii = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
}

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'lg',
      transition: 'all 0.2s ease',
    },
    variants: {
      solid: {
        bg: 'black',
        color: 'white',
        _hover: {
          bg: 'accent.600',
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        },
        _active: {
          bg: 'neutral.900',
          transform: 'translateY(0)',
        },
      },
      outline: {
        border: '2px solid',
        borderColor: 'black',
        color: 'black',
        bg: 'white',
        _hover: {
          bg: 'neutral.50',
          transform: 'translateY(-1px)',
          boxShadow: 'sm',
        },
      },
      ghost: {
        color: 'black',
        _hover: {
          bg: 'neutral.100',
        },
      },
      accent: {
        bg: 'accent.500',
        color: 'white',
        _hover: {
          bg: 'accent.600',
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        },
      },
    },
    sizes: {
      lg: {
        h: 12,
        fontSize: 'lg',
        px: 8,
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        borderRadius: 'xl',
        boxShadow: 'sm',
        border: '1px solid',
        borderColor: 'neutral.200',
        transition: 'all 0.2s ease',
        _hover: {
          boxShadow: 'md',
          transform: 'translateY(-2px)',
        },
      },
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          borderRadius: 'lg',
          borderColor: 'neutral.300',
          bg: 'white',
          _focus: {
            borderColor: 'black',
            boxShadow: '0 0 0 1px var(--chakra-colors-black)',
          },
        },
      },
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: 'bold',
      letterSpacing: '-0.025em',
    },
    sizes: {
      '4xl': {
        fontSize: ['3xl', '4xl', '5xl'],
        lineHeight: 1,
      },
    },
  },
}

export const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  space,
  sizes,
  shadows,
  radii,
  components,
})
