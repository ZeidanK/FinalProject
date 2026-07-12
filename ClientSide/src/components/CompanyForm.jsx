import PropTypes from 'prop-types'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'

export default function CompanyForm({ form, setForm, saving, onSave, onCancel, isNew }) {
  const handleChange = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  return (
    <Box
      sx={{
        p: 2.5,
        mb: 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'primary.main',
        bgcolor: 'rgba(88, 166, 255, 0.04)',
      }}
    >
      <Typography fontWeight={700} sx={{ mb: 2 }}>
        {isNew ? 'New Company' : 'Edit Company'}
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Company Name *"
            fullWidth
            value={form.name}
            onChange={handleChange('name')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Registration Number"
            fullWidth
            value={form.registrationNumber}
            onChange={handleChange('registrationNumber')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Street"
            fullWidth
            value={form.street}
            onChange={handleChange('street')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="City"
            fullWidth
            value={form.city}
            onChange={handleChange('city')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="State"
            fullWidth
            value={form.state}
            onChange={handleChange('state')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Postal Code"
            fullWidth
            value={form.postalCode}
            onChange={handleChange('postalCode')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Country"
            fullWidth
            value={form.country}
            onChange={handleChange('country')}
          />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 0.5 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Email"
            fullWidth
            value={form.email}
            onChange={handleChange('email')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Phone"
            fullWidth
            value={form.phone}
            onChange={handleChange('phone')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Website"
            fullWidth
            value={form.website}
            onChange={handleChange('website')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="Tax ID"
            fullWidth
            value={form.taxId}
            onChange={handleChange('taxId')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="VAT Number"
            fullWidth
            value={form.vatNumber}
            onChange={handleChange('vatNumber')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="Currency"
            fullWidth
            value={form.currency}
            onChange={handleChange('currency')}
          />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2.5 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<CloseRoundedIcon />}
          onClick={onCancel}
          aria-label={isNew ? 'Cancel creating company' : 'Cancel editing company'}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveRoundedIcon />
            )
          }
          disabled={saving}
          onClick={onSave}
          aria-label={isNew ? 'Create company' : 'Save company changes'}
        >
          {isNew ? 'Create Company' : 'Save Changes'}
        </Button>
      </Stack>
    </Box>
  )
}

CompanyForm.propTypes = {
  form: PropTypes.shape({
    name: PropTypes.string,
    registrationNumber: PropTypes.string,
    street: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    postalCode: PropTypes.string,
    country: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    website: PropTypes.string,
    taxId: PropTypes.string,
    vatNumber: PropTypes.string,
    currency: PropTypes.string,
  }).isRequired,
  setForm: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isNew: PropTypes.bool,
}

CompanyForm.defaultProps = {
  isNew: false,
}
