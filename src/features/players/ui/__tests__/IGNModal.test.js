import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the api module so submitIGN is a controllable jest fn
jest.mock('../../../../utils/api', () => ({
  tournamentAPI: {
    submitIGN: jest.fn(() => Promise.resolve({ data: { ign_submissions: {}, ign_locked: false } })),
  },
}));

import { IGNModal } from '../PlayerCredentialsView';
import { tournamentAPI } from '../../../../utils/api';

const baseRegistration = (overrides = {}) => ({
  id: 1,
  tournament: { id: 5, game_mode: 'Squad', game_name: 'BGMI' },
  player: { user: { username: 'cap' } },
  team_members: [],
  ign_submissions: {},
  invited_members_status: {},
  ...overrides,
});

const renderModal = (props = {}) =>
  render(
    <IGNModal
      registration={props.registration || baseRegistration()}
      gameName="BGMI"
      myUsername={props.myUsername || 'cap'}
      myProfileIGN={props.myProfileIGN || ''}
      isCaptain={props.isCaptain !== undefined ? props.isCaptain : true}
      onSubmitted={props.onSubmitted || jest.fn()}
      onClose={props.onClose || jest.fn()}
    />
  );

beforeEach(() => {
  tournamentAPI.submitIGN.mockClear();
  tournamentAPI.submitIGN.mockResolvedValue({
    data: { ign_submissions: {}, ign_locked: false },
  });
});

describe('IGNModal — always-editable, no-blocking redesign', () => {
  test('broken snapshot (captain only) still shows 4 editable inputs, no dead "No player" cards', () => {
    // team_members only has the captain — the exact bug that got the feature hidden
    renderModal({
      registration: baseRegistration({
        team_members: [{ username: 'cap', is_registered: true }],
      }),
    });

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(4); // captain + Player 2/3/4 — all enterable
    expect(screen.queryByText(/No player/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Empty slot/i)).not.toBeInTheDocument();
    // Generic padded slots are labelled
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('Player 4')).toBeInTheDocument();
  });

  test('full snapshot labels each known member and pre-fills submitted IGNs as EDITABLE', () => {
    renderModal({
      registration: baseRegistration({
        team_members: [
          { username: 'cap' },
          { username: 'mate1' },
          { username: 'mate2' },
          { username: 'mate3' },
        ],
        ign_submissions: { cap: 'CapIGN', mate1: 'Mate1IGN' },
      }),
    });

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(4);
    // Pre-filled values present AND editable (they are <input>, not locked text)
    expect(screen.getByDisplayValue('CapIGN')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mate1IGN')).toBeInTheDocument();
    // No lock UI anymore
    expect(screen.queryByText(/locked and cannot/i)).not.toBeInTheDocument();
  });

  test('captain profile IGN pre-fills the captain slot when no submission exists', () => {
    renderModal({
      myProfileIGN: 'ProfileIGN',
      registration: baseRegistration({ team_members: [{ username: 'cap' }] }),
    });
    expect(screen.getByDisplayValue('ProfileIGN')).toBeInTheDocument();
  });

  test('submit sends only non-empty entries (partial 1-of-4 allowed)', async () => {
    const onSubmitted = jest.fn();
    renderModal({
      onSubmitted,
      registration: baseRegistration({ team_members: [{ username: 'cap' }] }),
    });

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'OnlyCap' } });
    fireEvent.click(screen.getByText(/Save IGNs/i));

    await waitFor(() => expect(tournamentAPI.submitIGN).toHaveBeenCalledTimes(1));
    expect(tournamentAPI.submitIGN).toHaveBeenCalledWith(5, 1, {
      ign_submissions: { cap: 'OnlyCap' },
    });
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
  });

  test('already-submitted IGN can be edited and re-submitted with the new value', async () => {
    renderModal({
      registration: baseRegistration({
        team_members: [{ username: 'cap' }],
        ign_submissions: { cap: 'OldIGN' },
      }),
    });

    const editable = screen.getByDisplayValue('OldIGN');
    fireEvent.change(editable, { target: { value: 'CorrectedIGN' } });
    fireEvent.click(screen.getByText(/Save IGNs/i));

    await waitFor(() => expect(tournamentAPI.submitIGN).toHaveBeenCalledTimes(1));
    expect(tournamentAPI.submitIGN).toHaveBeenCalledWith(5, 1, {
      ign_submissions: { cap: 'CorrectedIGN' },
    });
  });

  test('Save button disabled when every field is empty', () => {
    renderModal({ registration: baseRegistration({ team_members: [{ username: 'cap' }] }) });
    expect(screen.getByText(/Save IGNs/i).closest('button')).toBeDisabled();
  });

  test('non-captain sees a read-only view with no Save button', () => {
    renderModal({
      isCaptain: false,
      myUsername: 'someoneelse',
      registration: baseRegistration({
        team_members: [{ username: 'cap' }],
        ign_submissions: { cap: 'CapIGN' },
      }),
    });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/Save IGNs/i)).not.toBeInTheDocument();
    expect(screen.getByText('CapIGN')).toBeInTheDocument(); // shown read-only
  });

  test('duplicate usernames in snapshot are de-duplicated into one slot', () => {
    renderModal({
      registration: baseRegistration({
        team_members: [{ username: 'cap' }, { username: 'cap' }, { username: 'mate1' }],
      }),
    });
    // cap (1) + mate1 (1) + padded Player 4 -> still exactly modeCap(4) inputs, no dupes
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(4);
  });
});
