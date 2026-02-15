import React from 'react';
import { screen } from '@testing-library/react';
import { render, mockScrim } from '../../utils/testUtils';
import ScrimCard from '../ScrimCard';

describe.skip('ScrimCard Component', () => {
  test('renders scrim information correctly', () => {
    const { container } = render(<ScrimCard scrim={mockScrim} />);

    // Check if scrim details are displayed
    expect(screen.getByText('Test Scrim')).toBeInTheDocument();
    expect(container.textContent).toContain('CODM');
    expect(container.textContent).toContain('TDM');
    expect(container.textContent).toContain('Test Host');
    expect(screen.getByText('10/20')).toBeInTheDocument(); // Participants
  });

  test('displays correct status badge color for upcoming scrim', () => {
    render(<ScrimCard scrim={mockScrim} />);
    const statusBadge = screen.getByText('upcoming');
    expect(statusBadge).toHaveClass('bg-accent-cyan', 'text-white');
  });

  test('displays correct status badge color for ongoing scrim', () => {
    const ongoingScrim = { ...mockScrim, status: 'ongoing' };
    render(<ScrimCard scrim={ongoingScrim} />);
    const statusBadge = screen.getByText('ongoing');
    expect(statusBadge).toHaveClass('bg-success', 'text-white');
  });

  test('displays correct status badge color for completed scrim', () => {
    const completedScrim = { ...mockScrim, status: 'completed' };
    render(<ScrimCard scrim={completedScrim} />);
    const statusBadge = screen.getByText('completed');
    expect(statusBadge).toHaveClass('bg-gray-600', 'text-gray-200');
  });

  test('displays correct status badge color for cancelled scrim', () => {
    const cancelledScrim = { ...mockScrim, status: 'cancelled' };
    render(<ScrimCard scrim={cancelledScrim} />);
    const statusBadge = screen.getByText('cancelled');
    expect(statusBadge).toHaveClass('bg-danger', 'text-white');
  });

  test('formats date correctly', () => {
    render(<ScrimCard scrim={mockScrim} />);
    // The date should be formatted as a locale date string
    const dateElement = screen.getByText(/12\/1\/2025|12\/01\/2025|1\/12\/2025|01\/12\/2025/);
    expect(dateElement).toBeInTheDocument();
  });

  test('links to scrim detail page', () => {
    const { container } = render(<ScrimCard scrim={mockScrim} />);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/scrims/1');
  });
});
