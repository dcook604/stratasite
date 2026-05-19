import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Spectrum 4 brand colors
				'spectrum-red': '#EF4444',
				'spectrum-green': '#22C55E',
				'spectrum-blue': '#0EA5E9',
				'spectrum-yellow': '#F59E0B',
				// Spectrum 4 surface colors
				surface: '#f9f9ff',
				'surface-subtle': '#F9FAFB',
				'surface-brand': '#F0F7FF',
				'surface-dim': '#d3daea',
				'surface-bright': '#f9f9ff',
				'surface-container-lowest': '#ffffff',
				'surface-container-low': '#f0f3ff',
				'surface-container': '#e7eefe',
				'surface-container-high': '#e2e8f8',
				'surface-container-highest': '#dce2f3',
				'surface-variant': '#dce2f3',
				'on-surface': '#151c27',
				'on-surface-variant': '#45464c',
				'inverse-surface': '#2a313d',
				'inverse-on-surface': '#ebf1ff',
				outline: '#76777d',
				'outline-variant': '#c6c6cd',
				'surface-tint': '#575e70',
				'primary-container': '#141b2b',
				'on-primary-container': '#7d8497',
				'secondary-container': '#39b8fd',
				'on-secondary-container': '#004666',
				'error-container': '#ffdad6',
				'on-error-container': '#93000a',
				'secondary-fixed': '#c9e6ff',
				'secondary-fixed-dim': '#89ceff',
				'on-secondary-fixed': '#001e2f',
				'on-secondary-fixed-variant': '#004c6e',
					'on-primary': '#ffffff',
					'on-secondary': '#ffffff',
					'on-background': '#151c27',
					'tertiary': '#000000',
					'on-tertiary': '#ffffff',
					'error': '#ba1a1a',
					'on-error': '#ffffff',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl: '0.5rem',
				'2xl': '0.75rem',
				'3xl': '1rem',
			},
			spacing: {
				'section-gap': '48px',
				'gutter': '24px',
				'margin-mobile': '16px',
				'base': '8px',
				'card-padding': '24px',
				'container-max': '1280px',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				'display': ['Inter', 'system-ui', 'sans-serif'],
				'body': ['Inter', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
				'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
				'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
				'title-lg': ['20px', { lineHeight: '28px', fontWeight: '600' }],
				'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
				'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
				'label-md': ['12px', { lineHeight: '16px', fontWeight: '600' }],
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
