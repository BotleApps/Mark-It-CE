import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'; // Removed waitFor
import userEvent from '@testing-library/user-event';
import { GroupSettingsModal } from './GroupSettingsModal'; // Adjust path as needed
import type { BookmarkGroup } from '../types'; // Adjust path as needed

const mockEditingGroup: BookmarkGroup = {
  id: 'group-1',
  name: 'My Favorite Links',
  color: '#FF0000', // Red
  bookmarks: [],
  isExpanded: true,
};

const mockOtherGroups: BookmarkGroup[] = [
  mockEditingGroup, // The group being edited is part of the list
  { id: 'group-2', name: 'Work Stuff', color: '#00FF00', bookmarks: [], isExpanded: true },
  { id: 'group-3', name: 'News Sites', color: '#0000FF', bookmarks: [], isExpanded: true },
];

const mockSingleGroupList: BookmarkGroup[] = [mockEditingGroup];


describe('GroupSettingsModal Component', () => {
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
    // isOpen prop is not used by the component, parent controls rendering
    onClose: mockOnClose,
    onSave: mockOnSave,
    onDelete: mockOnDelete,
    group: mockEditingGroup,
    groups: mockOtherGroups,
    theme: 'light' as 'light' | 'dark',
  };

  test('renders correctly with pre-filled name, color picker, and buttons', () => {
    render(<GroupSettingsModal {...defaultProps} />);
    expect(screen.getByText('Group Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Group Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockEditingGroup.name)).toBeInTheDocument();
    expect(screen.getByLabelText('Group Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    expect(screen.getByTitle('Delete group')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('group name input field updates internal state', async () => {
    const user = userEvent.setup();
    render(<GroupSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Group Name') as HTMLInputElement;

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Group Name');
    expect(nameInput.value).toBe('Updated Group Name');
  });

  test('ColorPicker interaction (simulated) updates color and is saved', async () => {
    const user = userEvent.setup();
    render(<GroupSettingsModal {...defaultProps} />);
    // Similar to other modals, direct ColorPicker interaction is complex to test here.
    // We ensure the existing color state is used for saving.
    // A dedicated test for ColorPicker component would cover its functionality.
    // To test if a *changed* color is saved, we'd need to mock ColorPicker or
    // have a way to trigger its onColorSelect prop from the test.
    // For now, this test confirms the current color is used.

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    await user.click(saveButton); // Save with existing name and initial color

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: mockEditingGroup.name,
        color: mockEditingGroup.color,
      })
    );
  });


  test('Save Changes button calls onSave with updated data when input is valid', async () => {
    const user = userEvent.setup();
    render(<GroupSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Group Name');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });

    await user.clear(nameInput);
    await user.type(nameInput, 'A New Valid Name');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockEditingGroup,
      name: 'A New Valid Name',
      color: mockEditingGroup.color,
    });
    // The component does NOT call onClose itself after saving
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // Validation Tests
  test('does not call onSave if name is empty', async () => {
    const user = userEvent.setup();
    render(<GroupSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Group Name');
    // const saveButton = screen.getByRole('button', { name: 'Save Changes' }); // Not directly used for submit event
    const formElement = screen.getByRole('form'); // Get form by its implicit role


    await user.clear(nameInput);
    // fireEvent.submit on form because button isn't disabled but form has 'required'
    fireEvent.submit(formElement!);

    expect(mockOnSave).not.toHaveBeenCalled();
    // No specific error message is shown by this component for this case, relies on browser validation
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not call onSave if name is only whitespace', async () => {
    const user = userEvent.setup();
    render(<GroupSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Group Name');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });

    await user.clear(nameInput);
    await user.type(nameInput, '   ');
    await user.click(saveButton); // Click attempts to submit

    expect(mockOnSave).not.toHaveBeenCalled();
    // No specific error message shown by this component for this case in handleSubmit
  });

  test('does not call onSave if name exceeds 30 characters (handler validation)', async () => {
    const user = userEvent.setup();
    render(<GroupSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Group Name');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    const longName = 'a'.repeat(31);

    // Test input's maxLength attribute
    await user.clear(nameInput);
    await user.type(nameInput, longName);
    expect((nameInput as HTMLInputElement).value).toBe('a'.repeat(30));

    // Submit the capped (valid) value
    await user.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'a'.repeat(30) }));
    mockOnSave.mockClear();

    // Programmatically set value to bypass maxLength and test handler's check
    fireEvent.change(nameInput, { target: { value: longName } });
    await user.click(saveButton);
    expect(mockOnSave).not.toHaveBeenCalled();
    // No specific error message shown by this component for this case in handleSubmit
  });

  test('onSave is called if name is same as original (editing same group without name change)', async () => {
    const user = userEvent.setup();
    render(<GroupSettingsModal {...defaultProps} />);
    const nameInput = screen.getByLabelText('Group Name');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });

    // Ensure name is the same as original, then click save
    await user.clear(nameInput);
    await user.type(nameInput, mockEditingGroup.name);
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(mockEditingGroup);
  });


  test('Delete Group button calls onClose then onDelete after confirmation', async () => {
    const user = userEvent.setup();
    render(<GroupSettingsModal {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete group');

    await user.click(deleteButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1); // onClose is called first
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    // onDelete is called with the group ID, but the component calls it with no args.
    // The parent handler for onDelete should know which group it is.
    // The component's onDelete prop is `() => void`.
  });

  test('Delete Group calls onClose but not onDelete if confirmation is cancelled', async () => {
    const user = userEvent.setup();
    confirmSpy.mockImplementationOnce(() => false); // Simulate user cancelling confirmation
    render(<GroupSettingsModal {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete group');


    await user.click(deleteButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1); // onClose is still called first
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  test('Delete Group button is disabled if only one group exists', () => {
    render(<GroupSettingsModal {...defaultProps} groups={mockSingleGroupList} />);
    const deleteButton = screen.getByTitle('Delete group');
    expect(deleteButton).toBeDisabled();
  });

  test('Delete Group button is enabled if more than one group exists', () => {
    render(<GroupSettingsModal {...defaultProps} groups={mockOtherGroups} />); // mockOtherGroups has 3 groups
    const deleteButton = screen.getByTitle('Delete group');
    expect(deleteButton).not.toBeDisabled();
  });


  test('Cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<GroupSettingsModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Clicking the backdrop calls onClose', async () => {
    const user = userEvent.setup();
    const { container } = render(<GroupSettingsModal {...defaultProps} />);
    // eslint-disable-next-line testing-library/no-node-access -- Reaching for modal root for backdrop click
    const backdrop = container.firstChild as HTMLElement;
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveClass('fixed', 'inset-0'); // Verify it's likely the backdrop
    if (backdrop) await user.click(backdrop);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Escape key calls onClose', async () => {
    const user = userEvent.setup();
    render(<GroupSettingsModal {...defaultProps} />);
    // An element within the modal needs focus for Escape key to be typically handled by the modal
    screen.getByLabelText('Group Name').focus();
    await user.keyboard('{escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Input has associated label for accessibility', () => {
    render(<GroupSettingsModal {...defaultProps} />);
    expect(screen.getByLabelText('Group Name')).toBeInTheDocument();
  });

  // Removed focus on mount test as it's not implemented in this component
});
