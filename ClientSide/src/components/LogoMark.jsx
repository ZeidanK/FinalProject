import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'

/**
 * Render the application logo mark used in headers and navigation.
 *
 * @param {{sx?: import('@mui/material').SxProps}} props
 * @param {import('@mui/material').SxProps} [props.sx] - Additional style overrides for the wrapper box.
 * @returns {JSX.Element}
 */
export default function LogoMark({ sx }) {
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: '10px',
        bgcolor: 'primary.main',
        boxShadow: '0 10px 28px rgba(88, 166, 255, 0.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
    >
      <AccountBalanceWalletRoundedIcon sx={{ fontSize: 20, color: '#fff' }} />
    </Box>
  )
}

LogoMark.propTypes = {
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
}
