import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in (e.g. back-button after login), redirect away immediately
  useEffect(() => {
    if (!loading && user) {
      const dest = user.role === 'OWNER' ? '/owner/dashboard' : '/waiter/new-sale';
      navigate(dest, { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter your username and password.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const loggedInUser = await login(username.trim(), password);
      // Navigate immediately after login — user state is already set by login()
      const dest = loggedInUser.role === 'OWNER' ? '/owner/dashboard' : '/waiter/new-sale';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // While checking stored session, show nothing (AuthProvider shows spinner anyway)
  if (loading) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4A2318 0%, #6B3A2A 50%, #9C5E45 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }} elevation={8}>
        <CardContent sx={{ p: 4 }}>
          {/* Brand */}
          <Box textAlign="center" mb={3}>
            <Box
              sx={{
                display: 'inline-flex',
                bgcolor: 'primary.main',
                borderRadius: '50%',
                p: 1.5,
                mb: 2,
              }}
            >
              <LocalCafeIcon sx={{ fontSize: 36, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Yohanan Coffee
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sales Audit System
            </Typography>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={submitting}
              sx={{ mb: 2 }}
              inputProps={{ 'aria-label': 'Username' }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              inputProps={{ 'aria-label': 'Password' }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={submitting}
              sx={{ py: 1.5 }}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : 'LOGIN'}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
            Addis Ababa, Ethiopia
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
