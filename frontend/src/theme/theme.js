import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6B3A2A',      // Deep coffee brown
      light: '#9C5E45',
      dark: '#4A2318',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C8956C',      // Warm caramel
      light: '#DDBB99',
      dark: '#A06B3F',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
    },
    warning: {
      main: '#E65100',
      light: '#FF8A50',
    },
    error: {
      main: '#C62828',
    },
    background: {
      default: '#FAF7F4',   // Warm off-white
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C1810',
      secondary: '#6B5344',
    },
    divider: '#E8D8CC',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(107, 58, 42, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
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
