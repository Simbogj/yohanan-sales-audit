import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

import LoadingSpinner from '../../components/common/LoadingSpinner';

import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const EMPTY_FORM = { full_name: '', username: '', password: '', role: 'WAITER' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, user: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true, user: null });
  };

  const openEdit = (u) => {
    setForm({ full_name: u.full_name, username: u.username, password: '', role: u.role });
    setModal({ open: true, user: u });
  };

  const handleSave = async () => {
    if (!form.full_name || !form.username) {
      toast.error('Full name and username are required');
      return;
    }
    if (!modal.user && !form.password) {
      toast.error('Password is required for new users');
      return;
    }
    try {
      setSaving(true);
      if (modal.user) {
        await userService.update(modal.user.id, form);
        toast.success('User updated');
      } else {
        await userService.create(form);
        toast.success('User created');
      }
      setModal({ open: false, user: null });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u) => {
    if (u.id === currentUser.id) {
      toast.error("You can't deactivate your own account");
      return;
    }
    try {
      await userService.updateStatus(u.id, !u.active);
      toast.success(`${u.full_name} ${u.active ? 'deactivated' : 'activated'}`);
      loadUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">Users</Typography>
          <Typography variant="body2" color="text.secondary">Manage owner and waiter accounts</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add User
        </Button>
      </Box>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Username</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell align="center"><strong>Active</strong></TableCell>
                <TableCell align="center"><strong>Edit</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover sx={{ '&:last-child td': { border: 0 }, opacity: u.active ? 1 : 0.55 }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{u.full_name}</Typography>
                    {u.id === currentUser.id && (
                      <Typography variant="caption" color="primary.main">(you)</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{u.username}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.role}
                      size="small"
                      color={u.role === 'OWNER' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={u.active}
                      onChange={() => handleToggleStatus(u)}
                      size="small"
                      color="success"
                      disabled={u.id === currentUser.id}
                      inputProps={{ 'aria-label': `Toggle ${u.full_name}` }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(u)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* User Modal */}
      <Dialog open={modal.open} onClose={() => setModal({ open: false, user: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{modal.user ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {!modal.user && (
              <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
                Use a strong password. Share it securely with the user.
              </Alert>
            )}
            <TextField
              label="Full Name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={modal.user ? 'New Password (leave blank to keep)' : 'Password'}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!modal.user}
              fullWidth
            />
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={form.role}
                label="Role"
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <MenuItem value="WAITER">Waiter</MenuItem>
                <MenuItem value="OWNER">Owner</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModal({ open: false, user: null })} variant="outlined">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
