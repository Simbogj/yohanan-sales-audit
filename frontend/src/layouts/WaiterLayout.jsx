import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LogoutIcon from '@mui/icons-material/Logout';

import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'New Sale', path: '/waiter/new-sale', icon: <AddCircleIcon /> },
  { label: 'My Sales', path: '/waiter/my-sales', icon: <ReceiptIcon /> },
];

export default function WaiterLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const currentNav = navItems.findIndex((n) => location.pathname.startsWith(n.path));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top AppBar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <LocalCafeIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
            Yohanan Coffee
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, opacity: 0.85 }}>
            {user?.full_name}
          </Typography>
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ bgcolor: 'primary.dark', width: 32, height: 32, fontSize: 13 }}>
              {user?.full_name?.charAt(0)}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={logout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Page content */}
      <Box component="main" sx={{ flex: 1, p: 2, pb: 10, overflow: 'auto' }}>
        <Outlet />
      </Box>

      {/* Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }} elevation={4}>
        <BottomNavigation
          value={currentNav === -1 ? 0 : currentNav}
          sx={{ bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
              component={Link}
              to={item.path}
              sx={{
                '&.Mui-selected': { color: 'primary.main' },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
