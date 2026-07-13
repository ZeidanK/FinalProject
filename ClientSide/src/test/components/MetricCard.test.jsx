import { render, screen } from '@testing-library/react'
import MetricCard from '../../components/MetricCard'

describe('MetricCard', () => {
  it('renders the title without requiring an icon', () => {
    render(<MetricCard title="Total users" value="100" />)

    expect(screen.getByText('Total users')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('keeps rendering title and icon together', () => {
    render(
      <MetricCard
        icon={<span data-testid="metric-icon" />}
        title="Open anomalies"
        value="5"
      />,
    )

    expect(screen.getByTestId('metric-icon')).toBeInTheDocument()
    expect(screen.getByText('Open anomalies')).toBeInTheDocument()
  })
})
