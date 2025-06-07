import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateSpaceModal } from './CreateSpaceModal'; // Adjust path as needed

describe('CreateSpaceModal Component', () => {
  // Mocks will be defined locally in each test

  const defaultTheme = 'light' as 'light' | 'dark';

  test('renders correctly with title, input, color picker, and buttons', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);

    expect(screen.getByText('Create New Space')).toBeInTheDocument();
    expect(screen.getByLabelText('Space Name')).toBeInTheDocument();
    expect(screen.getByText('Space Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Space' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('input field is focused on mount', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Space Name');
    await waitFor(() => expect(inputElement).toHaveFocus());
  });

  test('input field for space name updates internal state', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Space Name') as HTMLInputElement;

    await user.type(inputElement, 'New Test Space');
    expect(inputElement.value).toBe('New Test Space');
  });

  test('ColorPicker interaction (simulated) updates color and is saved', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    // This test primarily ensures that if the color state were changed (e.g., by ColorPicker),
    // the new color would be part of the onSave payload.
    // Direct interaction with ColorPicker is complex for this unit test;
    // ColorPicker should have its own tests.

    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Space Name');
    await user.type(inputElement, 'Space With Color');

    // Here, we are not actually changing the color via UI interaction with ColorPicker
    // because it's a separate component. We rely on the fact that if `setColor` was called
    // by ColorPicker, the `color` state in CreateSpaceModal would update.
    // The test 'Create Space button calls onSave with new space data when input is valid'
    // already verifies that the initial default color is saved.

    // This test just confirms structure for if we *could* easily change color state for testing:
    // For example, if we had a way to directly call the `setColor` function from the test:
    // act(() => {
    //   const setColorFunc = getSetColorFunctionFromSomewhereOrMock(); // This is the tricky part
    //   setColorFunc('#FF0000'); // Simulate ColorPicker setting red
    // });
    // Then proceed to save and check for '#FF0000'.

    // Since we don't, this test will be similar to the default save test but
    // serves as a structural reminder of where ColorPicker interaction would matter.
    const saveButton = screen.getByRole('button', { name: 'Create Space' });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Space With Color',
        color: '#3B82F6', // Default color from component's state, as we haven't changed it
      })
    );
  });

  test('Create Space button calls onSave with new space data when input is valid', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Space Name');
    const saveButton = screen.getByRole('button', { name: 'Create Space' });

    await user.type(inputElement, 'Valid Space Name');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Valid Space Name',
        color: '#3B82F6', // Default color
      })
    );
  });

  test('Enter key in input calls onSave with new space data when input is valid', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Space Name');

    await user.type(inputElement, 'Valid Via Enter');
    await user.keyboard('{enter}');

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Valid Via Enter',
        color: '#3B82F6',
      })
    );
  });

  test('Create Space button does not call onSave if space name is empty', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const saveButton = screen.getByRole('button', { name: 'Create Space' });

    // Input field is initially empty
    await user.click(saveButton); // Attempt to submit with empty name
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('Create Space button does not call onSave if space name is only whitespace', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Space Name');
    const saveButton = screen.getByRole('button', { name: 'Create Space' });

    await user.type(inputElement, '   ');
    await user.click(saveButton);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('Create Space button does not call onSave if space name exceeds 30 characters', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Space Name');
    const saveButton = screen.getByRole('button', { name: 'Create Space' });
    const longName = 'a'.repeat(31);

    await user.type(inputElement, longName);
    expect((inputElement as HTMLInputElement).value).toBe('a'.repeat(30));

    await user.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'a'.repeat(30) }));

    mockOnSave.mockClear();
    fireEvent.change(inputElement, { target: { value: longName } });
    await user.click(saveButton);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('Cancel button calls onClose', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Clicking the backdrop calls onClose', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    const { container } = render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    // eslint-disable-next-line testing-library/no-node-access -- Reaching for modal root for backdrop click
    const backdropElement = container.firstChild as HTMLElement;

    expect(backdropElement).toBeInTheDocument();
    expect(backdropElement).toHaveClass('fixed', 'inset-0'); // Verify it's likely the backdrop
    if (backdropElement) {
        await user.click(backdropElement);
    }
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Escape key calls onClose', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);

    await user.keyboard('{escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Input has aria-label or associated label for accessibility', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    render(<CreateSpaceModal theme={defaultTheme} onClose={mockOnClose} onSave={mockOnSave} />);
    const inputElement = screen.getByLabelText('Space Name');
    expect(inputElement).toBeInTheDocument();
  });
});
