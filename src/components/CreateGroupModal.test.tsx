import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateGroupModal } from './CreateGroupModal'; // Adjust path as needed
// Removed unused BookmarkGroup type import

describe('CreateGroupModal Component', () => {
  const defaultTheme = 'light' as 'light' | 'dark';

  // No beforeEach for mockOnClose/mockOnSave, define in each test

  test('renders correctly with title, input, color picker, and buttons', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);

    expect(screen.getByText('Create New Group')).toBeInTheDocument();
    expect(screen.getByLabelText('Group Name')).toBeInTheDocument();
    expect(screen.getByText('Group Color')).toBeInTheDocument(); // Changed from getByLabelText
    expect(screen.getByRole('button', { name: 'Create Group' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('input field updates internal state', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Group Name') as HTMLInputElement;

    await user.type(inputElement, 'New Test Group');
    expect(inputElement.value).toBe('New Test Group');
  });

  test('Create Group button calls onSave with new group data when input is valid', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Group Name');
    const createButton = screen.getByRole('button', { name: 'Create Group' });

    await user.type(inputElement, 'Valid Group Name');
    await user.click(createButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Valid Group Name',
        color: '#3B82F6', // Default initial color
      })
    );
    // The component does not call onClose itself after saving.
    // expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Enter key in input calls onSave with new group data when input is valid', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Group Name');

    await user.type(inputElement, 'Valid Via Enter');
    await user.keyboard('{enter}');

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Valid Via Enter', // There was a duplicate name property here, removed one
        color: '#3B82F6',
      })
    );
  });

  // ColorPicker interaction tests are usually separate unless it's a very simple wrapper.
  // Assuming ColorPicker is tested independently.

  test('Create Group button does not call onSave if group name is empty', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const createButton = screen.getByRole('button', { name: 'Create Group' });

    await user.click(createButton); // Attempt to submit with empty name
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('Create Group button does not call onSave if group name is only whitespace', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Group Name');
    const createButton = screen.getByRole('button', { name: 'Create Group' });

    await user.type(inputElement, '   '); // Whitespace input
    await user.click(createButton);

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('Create Group button does not call onSave if group name exceeds 30 chars', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Group Name');
    const createButton = screen.getByRole('button', { name: 'Create Group' });
    const longName = 'a'.repeat(31);

    await user.type(inputElement, longName);
    expect(inputElement.value).toBe('a'.repeat(30)); // Input maxLength attribute should prevent more

    // Click to ensure the current value (30 chars) is processed
    await user.click(createButton);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({name: 'a'.repeat(30)}));

    // Clear mock and try to submit with a value that is programmatically set to be too long,
    // bypassing the input's maxLength for testing the handler's own length check.
    mockOnSave.mockClear();
    fireEvent.change(inputElement, { target: { value: longName } }); // Programmatically set value
    await user.click(createButton);
    expect(mockOnSave).not.toHaveBeenCalled(); // handleSubmit should prevent save
  });


  test('Cancel button calls onClose', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('Clicking the backdrop calls onClose', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    const { container } = render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);

    // The outermost div is the backdrop
    // eslint-disable-next-line testing-library/no-node-access -- Reaching for modal root for backdrop click
    const backdropElement = container.firstChild as HTMLElement;
    expect(backdropElement).toBeInTheDocument();
    expect(backdropElement).toHaveClass('fixed', 'inset-0'); // Verify it's likely the backdrop

    await user.click(backdropElement!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

   test('Escape key calls onClose', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    // Focus an element inside for Escape to be caught by the document listener
    screen.getByLabelText('Group Name').focus();
    await user.keyboard('{escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });


  test('Input has aria-label or associated label for accessibility', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    render(<CreateGroupModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Group Name'); // getByLabelText itself is an accessibility check
    expect(inputElement).toBeInTheDocument();

    // Additionally, check for aria-describedby if there's help text, or aria-invalid for errors.
    // For now, ensuring it's findable by its label is a good start.
  });
});
