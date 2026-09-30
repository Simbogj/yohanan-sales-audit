import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import PeopleIcon from '@mui/icons-material/People';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AssessmentIcon from '@mui/icons-material/Assessment';

import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 248;

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',     path: '/owner/dashboard', icon: <DashboardIcon /> },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Sales Audit',   path: '/owner/audit',       icon: <FactCheckIcon /> },
      { label: 'All Sales',     path: '/owner/sales',       icon: <ReceiptLongIcon /> },
      { label: 'Other Sales',   path: '/owner/other-sales', icon: <StorefrontIcon /> },
      { label: 'Unpaid Sales',  path: '/owner/unpaid',      icon: <MoneyOffIcon /> },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Purchases',     path: '/owner/purchases',   icon: <ShoppingCartIcon /> },
      { label: 'Expenses',      path: '/owner/expenses',    icon: <ReceiptIcon /> },
      { label: 'Profit Report', path: '/owner/profit',      icon: <AssessmentIcon /> },
      { label: 'Daily Report',  path: '/owner/report',      icon: <BarChartIcon /> },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Products',      path: '/owner/products',    icon: <LocalCafeIcon /> },
      { label: 'Users',         path: '/owner/users',       icon: <PeopleIcon /> },
    ],
  },
];

// Flat list used for AppBar title lookup
const allNavItems = navGroups.flatMap((g) => g.items);

export default function OwnerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Logo / Brand */}
      <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', flexShrink: 0 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <LocalCafeIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              Yohanan
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Sales Audit
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Grouped Nav Links */}
      {navGroups.map((group) => (
        <List
          key={group.label}
          dense
          subheader={
            <ListSubheader
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'text.disabled',
                lineHeight: '2.2',
                bgcolor: 'transparent',
              }}
            >
              {group.label}
            </ListSubheader>
          }
        >
          {group.items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    mb: 0.3,
                    bgcolor: active ? 'primary.main' : 'transparent',
                    color: active ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: active ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 34 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      ))}

      <Box sx={{ flex: 1 }} />
      <Divider />

      {/* User info */}
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary">Signed in as</Typography>
        <Typography variant="body2" fontWeight={600}>{user?.full_name}</Typography>
        <Typography variant="caption" color="text.secondary">Owner</Typography>
      </Box>
    </Box>
  );

  const pageTitle = allNavItems.find((n) => n.path === location.pathname)?.label || 'Yohanan Coffee';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar — permanent on desktop, drawer on mobile */}
      {!isMobile ? (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ flex: 1 }}>
              {pageTitle}
            </Typography>

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: 14 }}>
                {user?.full_name?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem disabled>
                <Typography variant="body2">{user?.full_name}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={logout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
