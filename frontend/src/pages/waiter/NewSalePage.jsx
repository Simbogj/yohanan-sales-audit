import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import NoDrinksIcon from '@mui/icons-material/NoDrinks';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';

import { productService } from '../../services/productService';
import { salesService } from '../../services/salesService';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

const CATEGORY_CONFIG = [
  { key: 'COFFEE', label: 'Coffee', icon: '☕', color: '#6B3A2A' },
  { key: 'NON_COFFEE', label: 'Non-Coffee', icon: '🥛', color: '#4A7B5C' },
  { key: 'BREAKFAST', label: 'Breakfast', icon: '🍳', color: '#B07A30' },
  { key: 'FOOD', label: 'Food', icon: '🍽️', color: '#6B5EA8' },
  { key: 'OTHER', label: 'Other', icon: '🧾', color: '#5A7A8A' },
];

const STEPS = { CATEGORY: 'CATEGORY', PRODUCT: 'PRODUCT', CONFIRM: 'CONFIRM', SUCCESS: 'SUCCESS' };

export default function NewSalePage() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [step, setStep] = useState(STEPS.CATEGORY);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  useEffect(() => {
    productService.getAll({ active: true }).then((data) => {
      setProducts(data);
      setLoadingProducts(false);
    }).catch(() => setLoadingProducts(false));
  }, []);

  const categoryProducts = products.filter((p) => p.category === selectedCategory);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setStep(STEPS.PRODUCT);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setStep(STEPS.CONFIRM);
  };

  const handleConfirmSale = async () => {
    try {
      setSubmitting(true);
      const sale = await salesService.create({ product_id: selectedProduct.id, quantity });
      setCompletedSale(sale);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSale = () => {
    setStep(STEPS.CATEGORY);
    setSelectedCategory(null);
    setSelectedProduct(null);
    setQuantity(1);
    setCompletedSale(null);
  };

  if (loadingProducts) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // ─── SUCCESS ────────────────────────────────────────────────────────────────
  if (step === STEPS.SUCCESS && completedSale) {
    return (
      <Box maxWidth={400} mx="auto" pt={4}>
        <Box textAlign="center" mb={3}>
          <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main' }} />
          <Typography variant="h5" fontWeight={700} color="success.main" mt={1}>
            Sale Recorded!
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>Sale Number</Typography>
            <Typography variant="h6" fontWeight={700} fontFamily="monospace" color="primary.main">
              {completedSale.sale_number}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">Product</Typography>
              <Typography variant="body2" fontWeight={600}>{completedSale.product_name}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">Quantity</Typography>
              <Typography variant="body2" fontWeight={600}>{completedSale.quantity}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">Unit Price</Typography>
              <Typography variant="body2">{formatCurrency(completedSale.unit_price)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body1" fontWeight={700}>Total</Typography>
              <Typography variant="body1" fontWeight={700} color="primary.main">
                {formatCurrency(completedSale.total_amount)}
              </Typography>
            </Box>
            <Box mt={2} textAlign="center">
              <Chip label={`Status: ${completedSale.status}`} color="warning" />
            </Box>
          </CardContent>
        </Card>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleNewSale}
          startIcon={<AddIcon />}
        >
          New Sale
        </Button>
      </Box>
    );
  }

  // ─── CONFIRM ────────────────────────────────────────────────────────────────
  if (step === STEPS.CONFIRM && selectedProduct) {
    const total = quantity * parseFloat(selectedProduct.price);
    return (
      <Box maxWidth={400} mx="auto" pt={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => setStep(STEPS.PRODUCT)} sx={{ mb: 2 }}>
          Back
        </Button>

        <Typography variant="h6" fontWeight={700} mb={3}>{selectedProduct.name}</Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" mb={2}>Quantity</Typography>

            {/* Quick quantity buttons */}
            <Grid container spacing={1} mb={2}>
              {[1, 2, 3, 4, 5, 6].map((q) => (
                <Grid item xs={4} key={q}>
                  <Button
                    fullWidth
                    variant={quantity === q ? 'contained' : 'outlined'}
                    onClick={() => setQuantity(q)}
                    sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 700 }}
                  >
                    {q}
                  </Button>
                </Grid>
              ))}
            </Grid>

            {/* Stepper */}
            <Box display="flex" alignItems="center" justifyContent="center" gap={2} mt={1}>
              <IconButton
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                size="large"
                color="primary"
                aria-label="Decrease quantity"
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="h4" fontWeight={700} minWidth={40} textAlign="center">
                {quantity}
              </Typography>
              <IconButton
                onClick={() => setQuantity((q) => q + 1)}
                size="large"
                color="primary"
                aria-label="Increase quantity"
              >
                <AddIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} px={1}>
          <Typography variant="body1" color="text.secondary">Total</Typography>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            {formatCurrency(total)}
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleConfirmSale}
          disabled={submitting}
          sx={{ py: 2 }}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : 'CONFIRM SALE'}
        </Button>
      </Box>
    );
  }

  // ─── PRODUCT SELECTION ───────────────────────────────────────────────────────
  if (step === STEPS.PRODUCT) {
    const catConfig = CATEGORY_CONFIG.find((c) => c.key === selectedCategory);
    return (
      <Box maxWidth={500} mx="auto" pt={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => setStep(STEPS.CATEGORY)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Typography variant="h6" fontWeight={700} mb={2}>
          {catConfig?.icon} {catConfig?.label}
        </Typography>

        {categoryProducts.length === 0 ? (
          <Alert severity="info">No active products in this category.</Alert>
        ) : (
          <Grid container spacing={2}>
            {categoryProducts.map((product) => (
              <Grid item xs={6} key={product.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    '&:hover': { borderColor: 'primary.main' },
                    transition: 'border-color 0.15s',
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelectProduct(product)}
                    sx={{ p: 2, minHeight: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Typography variant="body1" fontWeight={700} gutterBottom>
                      {product.name}
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {formatCurrency(product.price)}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  }

  // ─── CATEGORY SELECTION (default step) ───────────────────────────────────────
  const availableCategories = CATEGORY_CONFIG.filter((c) =>
    products.some((p) => p.category === c.key)
  );

  return (
    <Box maxWidth={500} mx="auto" pt={2}>
      <Box textAlign="center" mb={4}>
        <LocalCafeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700} color="primary.main">
          New Sale
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a category to start
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {availableCategories.map((cat) => (
          <Grid item xs={6} key={cat.key}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
                transition: 'transform 0.15s, box-shadow 0.15s',
                borderTop: '4px solid',
                borderColor: cat.color,
              }}
            >
              <CardActionArea
                onClick={() => handleSelectCategory(cat.key)}
                sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
              >
                <Typography sx={{ fontSize: 36 }}>{cat.icon}</Typography>
                <Typography variant="body1" fontWeight={700}>{cat.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {products.filter((p) => p.category === cat.key).length} items
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
