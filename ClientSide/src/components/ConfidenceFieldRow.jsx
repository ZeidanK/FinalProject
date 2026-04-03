import PropTypes from 'prop-types'
import { Chip, Stack, TextField, Typography } from '@mui/material'
import { confidenceColor, confidenceLabel } from '../utils/invoiceExtraction'

export default function ConfidenceFieldRow({
  label,
  value,
  confidence,
  onChange,
  fieldSx,
  labelVariant,
  labelColor,
  labelFontWeight,
  rowSx,
  inputWeight,
}) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={rowSx}>
      <Typography variant={labelVariant} color={labelColor} fontWeight={labelFontWeight}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          label={confidenceLabel(confidence)}
          size="small"
          color={confidenceColor(confidence || 0)}
        />
        <TextField
          size="small"
          type="number"
          sx={{ ...fieldSx, width: 140 }}
          value={value == null ? '' : value}
          onChange={(event) => onChange(event.target.value)}
          slotProps={{
            htmlInput: {
              min: 0,
              step: 0.01,
              style: { textAlign: 'right', fontWeight: inputWeight },
            },
          }}
        />
      </Stack>
    </Stack>
  )
}

ConfidenceFieldRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  confidence: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  fieldSx: PropTypes.object,
  labelVariant: PropTypes.string,
  labelColor: PropTypes.string,
  labelFontWeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  rowSx: PropTypes.object,
  inputWeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

ConfidenceFieldRow.defaultProps = {
  value: '',
  confidence: 0,
  fieldSx: {},
  labelVariant: 'body2',
  labelColor: 'text.secondary',
  labelFontWeight: 'normal',
  rowSx: {},
  inputWeight: 400,
}
