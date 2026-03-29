import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0d1b3e',
      light: '#3a4a7a',
      dark: '#000018',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff5252',
      light: '#ff867f',
      dark: '#c50e29',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#60ad5e',
      dark: '#005005',
    },
    error: {
      main: '#c62828',
      light: '#ff5f52',
      dark: '#8e0000',
    },
    warning: {
      main: '#f9a825',
      light: '#ffd95a',
      dark: '#c17900',
    },
    info: {
      main: '#1565c0',
      light: '#5e92f3',
      dark: '#003c8f',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#5c6880',
    },
    // Custom result type colors
    hit: {
      main: '#2e7d32',
      light: '#e8f5e9',
    },
    out: {
      main: '#c62828',
      light: '#ffebee',
    },
    onBase: {
      main: '#1565c0',
      light: '#e3f2fd',
    },
    sacrifice: {
      main: '#616161',
      light: '#f5f5f5',
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
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
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
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 16px rgba(255,82,82,0.4)',
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
