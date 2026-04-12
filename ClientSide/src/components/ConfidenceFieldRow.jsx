import PropTypes from 'prop-types'
import { Chip, Stack, TextField, Typography } from '@mui/material'
import { confidenceColor, confidenceLabel } from '../utils/invoiceExtraction'

/**
 * Renders a label, confidence badge, and numeric input for an invoice field.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - The label text for the field row.
 * @param {number|string} props.value - The current value shown in the text field.
 * @param {number} props.confidence - Confidence score used to render the badge.
 * @param {function(string): void} props.onChange - Callback when the field value changes.
 * @param {object} [props.fieldSx] - Custom style overrides for the text field.
 * @param {string} [props.labelVariant] - Typography variant for the label.
 * @param {string} [props.labelColor] - Typography color for the label.
 * @param {string|number} [props.labelFontWeight] - Font weight for the label.
 * @param {object} [props.rowSx] - Style overrides for the row container.
 * @param {string|number} [props.inputWeight] - Font weight for the numeric input.
 * @returns {JSX.Element} The rendered confidence field row.
 */
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
