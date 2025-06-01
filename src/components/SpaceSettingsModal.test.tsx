import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'; // Removed waitFor
import userEvent from '@testing-library/user-event';
import { SpaceSettingsModal } from './SpaceSettingsModal'; // Adjust path as needed
import type { Space } from '../types'; // Adjust path as needed

const mockEditingSpace: Space = {
  id: 'space-1',
  name: 'My Personal Space',
  color: '#0000FF', // Blue
  groups: [],
};

const mockOtherSpaces: Space[] = [
  mockEditingSpace,
  { id: 'space-2', name: 'Work Projects', color: '#00FF00', groups: [] },
  { id: 'space-3', name: 'Learning Zone', color: '#FF00FF', groups: [] },
];

const mockSingleSpaceList: Space[] = [mockEditingSpace];

describe('SpaceSettingsModal Component', () => {
  let mockOnClose: jest.Mock;
  let mockOnSave: jest.Mock;
  let mockOnDelete: jest.Mock;
  let confirmSpy: jest.SpyInstance;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSave = jest.fn();
    mockOnDelete = jest.fn();
    confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  const defaultProps = {
    onClose: mockOnClose,
    onSave: mockOnSave,
    onDelete: mockOnDelete,
    space: mockEditingSpace,
    spaces: mockOtherSpaces,
    theme: 'light' as 'light' | 'dark',
  };

  test('renders correctly with pre-filled name, color picker, and buttons', () => {
    render(<SpaceSettingsModal {...defaultProps} />);
    expect(screen.getByText('Space Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Space Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockEditingSpace.name)).toBeInTheDocument();
    expect(screen.getByLabelText('Space Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(button => button.querySelector('svg.lucide-trash') !== null);
    expect(deleteButton).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('space name input field updates internal state', async () => {
    const user = userEvent.setup();
    render(<SpaceSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Space Name') as HTMLInputElement;

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Space Name');
    expect(nameInput.value).toBe('Updated Space Name');
  });

  test('ColorPicker interaction (simulated) results in current color being saved', async () => {
    const user = userEvent.setup();
    render(<SpaceSettingsModal {...defaultProps} />);
    // This test ensures that the color state (even if not changed by mock interaction here)
    // is correctly included in the onSave payload.
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: mockEditingSpace.name, // Name hasn't changed in this path
        color: mockEditingSpace.color,
      })
    );
  });

  test('Save Changes button calls onSave with updated data when input is valid', async () => {
    const user = userEvent.setup();
    render(<SpaceSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Space Name');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });

    await user.clear(nameInput);
    await user.type(nameInput, 'A New Valid Space Name');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockEditingSpace,
      name: 'A New Valid Space Name',
      color: mockEditingSpace.color,
    });
    expect(mockOnClose).not.toHaveBeenCalled(); // Component does not self-close on save
  });

  // Validation Tests
  test('does not call onSave if name is empty', async () => {
    // const user = userEvent.setup(); // Not needed if only using fireEvent for form
    render(<SpaceSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Space Name') as HTMLInputElement;
    // const saveButton = screen.getByRole('button', { name: 'Save Changes' }); // Not directly used for submit
    const formElement = screen.getByRole('form'); // Get form by its implicit role

    // Clear input using fireEvent as userEvent.clear might be slow or focus dependent here
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.submit(formElement); // Test form submission with required field empty

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('does not call onSave if name is only whitespace', async () => {
    const user = userEvent.setup();
    render(<SpaceSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Space Name');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });

    await user.clear(nameInput);
    await user.type(nameInput, '   ');
    await user.click(saveButton); // Click attempts to submit

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('does not call onSave if name exceeds 30 characters (handler validation)', async () => {
    const user = userEvent.setup();
    render(<SpaceSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Space Name') as HTMLInputElement;
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    const longName = 'a'.repeat(31);

    await user.clear(nameInput);
    await user.type(nameInput, longName); // Input value will be capped at 30 by maxLength
    expect(nameInput.value).toBe('a'.repeat(30));

    await user.click(saveButton); // Submit with 30 chars (valid)
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'a'.repeat(30) }));
    mockOnSave.mockClear();

    // Programmatically set value to bypass maxLength and test handler's length check
    fireEvent.change(nameInput, { target: { value: longName } });
    await user.click(saveButton);
    expect(mockOnSave).not.toHaveBeenCalled();
    // No specific error message is shown by this component for this validation in handleSubmit
  });

  test('onSave is called if name is same as original (editing same space without name change)', async () => {
    const user = userEvent.setup();
    render(<SpaceSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Space Name');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });

    // Ensure name is the same as original
    fireEvent.change(nameInput, {target: {value: mockEditingSpace.name}});
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(mockEditingSpace);
  });

  test('Delete Space button calls onClose then onDelete after confirmation', async () => {
    const user = userEvent.setup();
    render(<SpaceSettingsModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(button => button.querySelector('svg.lucide-trash') !== null)!;

    await user.click(deleteButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  test('Delete Space calls onClose but not onDelete if confirmation is cancelled', async () => {
    const user = userEvent.setup();
    confirmSpy.mockImplementationOnce(() => false);
    render(<SpaceSettingsModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(button => button.querySelector('svg.lucide-trash') !== null)!;

    await user.click(deleteButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  test('Delete Space button is disabled if only one space exists', () => {
    render(<SpaceSettingsModal {...defaultProps} spaces={mockSingleSpaceList} />);
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(button => button.querySelector('svg.lucide-trash') !== null)!;
    expect(deleteButton).toBeDisabled();
  });

  test('Delete Space button is enabled if more than one space exists', () => {
    render(<SpaceSettingsModal {...defaultProps} spaces={mockOtherSpaces} />);
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(button => button.querySelector('svg.lucide-trash') !== null)!;
    expect(deleteButton).not.toBeDisabled();
  });

  test('Cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<SpaceSettingsModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Clicking the backdrop calls onClose', async () => {
    const user = userEvent.setup();
    const { container } = render(<SpaceSettingsModal {...defaultProps} />);
    const backdrop = container.firstChild as HTMLElement;
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveClass('fixed', 'inset-0'); // Verify it's likely the backdrop
    if (backdrop) await user.click(backdrop); // userEvent for potential overlay interactions
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Escape key calls onClose', async () => {
    const user = userEvent.setup();
    render(<SpaceSettingsModal {...defaultProps} />);
    screen.getByLabelText('Space Name').focus(); // Focus an element inside for Escape to be caught
    await user.keyboard('{escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Input has associated label for accessibility', () => {
    render(<SpaceSettingsModal {...defaultProps} />);
    expect(screen.getByLabelText('Space Name')).toBeInTheDocument();
  });
});
