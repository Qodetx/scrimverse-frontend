import React from 'react';
import { screen } from '@testing-library/react';
import { render, mockTournament } from '../../utils/testUtils';
import TournamentCard from '../TournamentCard';

describe.skip('TournamentCard Component', () => {
  test('renders tournament information correctly', () => {
    const { container } = render(<TournamentCard tournament={mockTournament} />);

    // Check if tournament details are displayed
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(container.textContent).toContain('BGMI');
    expect(container.textContent).toContain('Squad');
    expect(container.textContent).toContain('Test Host');
    expect(container.textContent).toContain('10000'); // Prize pool
    expect(container.textContent).toContain('100'); // Entry fee
    expect(screen.getByText('50/100')).toBeInTheDocument(); // Participants
  });

  test('displays correct status badge color for upcoming tournament', () => {
    render(<TournamentCard tournament={mockTournament} />);
    const statusBadge = screen.getByText('upcoming');
    expect(statusBadge).toHaveClass('bg-accent-blue', 'text-white');
  });

  test('displays correct status badge color for ongoing tournament', () => {
    const ongoingTournament = { ...mockTournament, status: 'ongoing' };
    render(<TournamentCard tournament={ongoingTournament} />);
    const statusBadge = screen.getByText('ongoing');
    expect(statusBadge).toHaveClass('bg-success', 'text-white');
  });

  test('displays correct status badge color for completed tournament', () => {
    const completedTournament = { ...mockTournament, status: 'completed' };
    render(<TournamentCard tournament={completedTournament} />);
    const statusBadge = screen.getByText('completed');
    expect(statusBadge).toHaveClass('bg-gray-600', 'text-gray-200');
  });

  test('displays correct status badge color for cancelled tournament', () => {
    const cancelledTournament = { ...mockTournament, status: 'cancelled' };
    render(<TournamentCard tournament={cancelledTournament} />);
    const statusBadge = screen.getByText('cancelled');
    expect(statusBadge).toHaveClass('bg-danger', 'text-white');
  });

  test('displays featured badge when tournament is featured', () => {
    render(<TournamentCard tournament={mockTournament} />);
    expect(screen.getByText('⭐ Featured')).toBeInTheDocument();
  });

  test('does not display featured badge when tournament is not featured', () => {
    const nonFeaturedTournament = { ...mockTournament, is_featured: false };
    render(<TournamentCard tournament={nonFeaturedTournament} />);
    expect(screen.queryByText('⭐ Featured')).not.toBeInTheDocument();
  });

  test('displays banner image when available', () => {
    const tournamentWithBanner = {
      ...mockTournament,
      banner_image: 'http://localhost:8000/media/banner.jpg',
    };
    render(<TournamentCard tournament={tournamentWithBanner} />);
    const image = screen.getByAltText('Test Tournament');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'http://localhost:8000/media/banner.jpg');
  });

  test('does not display banner image when not available', () => {
    render(<TournamentCard tournament={mockTournament} />);
    const image = screen.queryByAltText('Test Tournament');
    expect(image).not.toBeInTheDocument();
  });

  test('formats date correctly', () => {
    render(<TournamentCard tournament={mockTournament} />);
    // The date should be formatted as a "Dec 1, 3:30 PM" or similar
    const dateElement = screen.getByText(/12\/1\/2025|12\/01\/2025|1\/12\/2025|01\/12\/2025/);
    expect(dateElement).toBeInTheDocument();
  });

  test('links to tournament detail page', () => {
    const { container } = render(<TournamentCard tournament={mockTournament} />);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/tournaments/1');
  });
});
