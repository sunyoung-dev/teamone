import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0d1b3e',
      light: '#1e3a6e',
      dark: '#000018',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0d1b3e',
      light: '#1e3a6e',
      dark: '#000018',
      contrastText: '#ffffff',
    },
    success: {
      main: '#1b5e20',
      light: '#4c8c4a',
      dark: '#003300',
      contrastText: '#ffffff',
    },
    error: {
      main: '#b71c1c',
      light: '#e05252',
      dark: '#7f0000',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#b45309',
      light: '#e07c22',
      dark: '#7c3700',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0277bd',
      light: '#58a5f0',
      dark: '#004c8c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    // Custom result type colors
    hit: {
      main: '#1b5e20',
      light: '#e8f5e9',
    },
    out: {
      main: '#b71c1c',
      light: '#ffebee',
    },
    onBase: {
      main: '#1565c0',
      light: '#e3f2fd',
    },
    sacrifice: {
      main: '#546e7a',
      light: '#eceff1',
    },
  },
  typography: {
    fontFamily: '"Noto Sans KR", "Roboto", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          borderTop: '1px solid rgba(0,0,0,0.08)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 64,
          padding: '6px 0',
          '&.Mui-selected': {
            color: '#0d1b3e',
          },
        },
        label: {
          fontSize: '0.7rem',
          '&.Mui-selected': {
            fontSize: '0.7rem',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
        sizeLarge: {
          minHeight: 56,
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(13,27,62,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(13,27,62,0.2)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 16px rgba(21,101,192,0.35)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 48,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
  },
});

export default theme;
