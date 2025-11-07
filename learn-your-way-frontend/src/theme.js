import { createTheme } from '@mui/material/styles';

/**
 * Custom theme with mobile-first responsive breakpoints
 * Breakpoint values match prompt specification
 */
const theme = createTheme({
  // Mobile-first breakpoints
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    }
  },

  // Color palette
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
      light: '#8b9df5',
      dark: '#4a5bb4',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#764ba2',
      light: '#9268ba',
      dark: '#533572',
      contrastText: '#ffffff'
    },
    success: {
      main: '#4ade80',
      light: '#6ee7a2',
      dark: '#339b5a',
      contrastText: '#ffffff'
    },
    error: {
      main: '#ef4444',
      light: '#f26969',
      dark: '#b93030',
      contrastText: '#ffffff'
    },
    warning: {
      main: '#f59e0b',
      light: '#f7b23c',
      dark: '#b97008',
      contrastText: '#ffffff'
    },
    info: {
      main: '#3b82f6',
      light: '#629bf8',
      dark: '#2a5baf',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#94a3b8'
    },
    divider: '#e2e8f0',
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      success: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
      info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    }
  },

  // Typography with responsive sizing
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      '@media (min-width:640px)': {
        fontSize: '3rem'
      },
      '@media (min-width:1024px)': {
        fontSize: '3.5rem'
      }
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      '@media (min-width:640px)': {
        fontSize: '2.25rem'
      },
      '@media (min-width:1024px)': {
        fontSize: '2.5rem'
      }
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      '@media (min-width:640px)': {
        fontSize: '1.75rem'
      },
      '@media (min-width:1024px)': {
        fontSize: '2rem'
      }
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
      '@media (min-width:640px)': {
        fontSize: '1.5rem'
      }
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      '@media (min-width:640px)': {
        fontSize: '1.25rem'
      }
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.6,
      '@media (min-width:640px)': {
        fontSize: '1.125rem'
      }
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
      '@media (min-width:640px)': {
        fontSize: '1rem'
      }
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5
    }
  },

  // Spacing scale
  spacing: 8, // Base unit: 8px

  // Component overrides for mobile-first design
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          minHeight: 44, // Touch-friendly minimum height
          '@media (max-width:640px)': {
            padding: '12px 20px'
          }
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '1rem',
          minHeight: 48
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.875rem',
          minHeight: 36
        }
      },
      defaultProps: {
        disableElevation: false
      }
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: 44 // Touch-friendly
          }
        }
      }
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          '@media (min-width:640px)': {
            borderRadius: 16
          }
        }
      }
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        },
        elevation2: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        },
        elevation3: {
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
        }
      }
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }
      }
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0
        }
      }
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 32
        }
      }
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44, // Touch-friendly
          minHeight: 44
        }
      }
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.1)'
        }
      }
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          padding: '6px 12px',
          '&.Mui-selected': {
            fontSize: '0.75rem'
          }
        }
      }
    },

    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:640px)': {
            paddingLeft: 16,
            paddingRight: 16
          }
        }
      }
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          '@media (max-width:640px)': {
            margin: 16,
            maxHeight: 'calc(100% - 32px)'
          }
        }
      }
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.875rem',
          borderRadius: 8,
          padding: '8px 12px'
        }
      }
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12
        }
      }
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 8
        }
      }
    }
  },

  // Custom shadows for mobile
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  ],

  // Z-index layers
  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500
  }
});

/**
 * Dark theme variant
 */
export const darkTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    mode: 'dark',
    primary: {
      main: '#8b9df5',
      light: '#a8b7f7',
      dark: '#667eea',
      contrastText: '#000000'
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b'
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      disabled: '#64748b'
    },
    divider: '#334155'
  }
});

export default theme;
