import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddBookmarkModal } from './AddBookmarkModal'; // Adjust path as needed

describe('AddBookmarkModal Component', () => {
  let mockOnClose: jest.Mock;
  let mockOnSave: jest.Mock;

  const mockGroupId = 'group-1-id';
  const mockSpaceId = 'space-1-id';

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSave = jest.fn();
    // Mock console.error for invalid URL constructor errors during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    jest.restoreAllMocks();
  });

  const defaultProps = {
    onClose: mockOnClose,
    onSave: mockOnSave,
    groupId: mockGroupId,
    spaceId: mockSpaceId,
    theme: 'light' as 'light' | 'dark',
  };

  test('renders correctly with title, URL inputs, and buttons', () => {
    render(<AddBookmarkModal {...defaultProps} />);
    expect(screen.getByText('Add Bookmark')).toBeInTheDocument(); // Modal Title
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Bookmark' })).toBeInTheDocument(); // Save button
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('input fields (title, URL) update internal state', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    const urlInput = screen.getByLabelText('URL') as HTMLInputElement;

    await user.type(titleInput, 'My Test Title');
    expect(titleInput.value).toBe('My Test Title');

    await user.clear(urlInput); // Clear if it has any default/previous value (though not expected here)
    await user.type(urlInput, 'https://test.example.com');
    expect(urlInput.value).toBe('https://test.example.com');
  });

  test('Add Bookmark button calls onSave with new bookmark data and calls onClose when inputs are valid', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);

    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    await user.type(titleInput, 'Valid Title');
    await user.type(urlInput, 'https://validurl.com');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Valid Title',
        url: 'https://validurl.com',
        createdAt: expect.any(String), // Check if createdAt is a string (ISO date)
      }),
      mockGroupId,
      mockSpaceId
    );
    // Check if createdAt is a valid date string
    const savedBookmarkArg = mockOnSave.mock.calls[0][0];
    expect(() => new Date(savedBookmarkArg.createdAt).toISOString()).not.toThrow();

    expect(mockOnClose).toHaveBeenCalledTimes(1); // Modal should close on successful save
  });

  test('Enter key in URL input calls onSave and onClose when inputs are valid', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');

    await user.type(titleInput, 'Title via Enter');
    await user.type(urlInput, 'https://enterkey.com');
    await user.keyboard('{enter}'); // Press Enter in the URL input

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Title via Enter',
        url: 'https://enterkey.com',
        createdAt: expect.any(String),
      }),
      mockGroupId,
      mockSpaceId
    );
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
   test('Enter key in Title input calls onSave and onClose when inputs are valid', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');

    await user.type(titleInput, 'Title via Enter');
    await user.type(urlInput, 'https://enterkey.com');
    // Simulate pressing Enter on the title input
    fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter', charCode: 13 });


    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Title via Enter',
        url: 'https://enterkey.com',
        createdAt: expect.any(String),
      }),
      mockGroupId,
      mockSpaceId
    );
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });


  // Validation Tests
  test('does not call onSave and shows error if title is empty', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    await user.type(urlInput, 'https://validurl.com');
    // Title is empty
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not call onSave and shows error if title is only whitespace', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    await user.type(titleInput, '   ');
    await user.type(urlInput, 'https://validurl.com');
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });


  test('does not call onSave and shows error if URL is empty', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    await user.type(titleInput, 'Valid Title');
    // URL is empty
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('URL is required.')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not call onSave and shows error if URL is invalid', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    await user.type(titleInput, 'Valid Title');
    await user.type(urlInput, 'invalid-url');
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('Invalid URL.')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('error message is cleared on subsequent valid submission attempt', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    // First attempt: invalid URL
    await user.type(titleInput, 'Valid Title');
    await user.type(urlInput, 'invalid-url');
    await user.click(saveButton);
    expect(screen.getByText('Invalid URL.')).toBeInTheDocument();

    // Second attempt: valid URL
    await user.clear(urlInput);
    await user.type(urlInput, 'https://valid.example.com');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Invalid URL.')).not.toBeInTheDocument(); // Error should be cleared
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });


  test('Cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('Clicking the backdrop calls onClose', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);
    const backdropElement = screen.getByText('Add Bookmark').closest('div.fixed.inset-0');

    expect(backdropElement).toBeInTheDocument();
    if (backdropElement) {
      await user.click(backdropElement);
    }
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Escape key calls onClose', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkModal {...defaultProps} />);

    // Need to focus something inside the modal for escape to be typically caught by the modal
    screen.getByLabelText('Title').focus();
    await user.keyboard('{escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('title input is focused on mount', async () => {
    render(<AddBookmarkModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    // The eslint-disable-next-line comment for testing-library/no-node-access that was here previously
    // is removed because the linter reported it as unused (though it also reported the error it was meant to suppress).
    await waitFor(() => expect(titleInput).toHaveFocus());
  });

  test('Inputs have associated labels for accessibility', () => {
    render(<AddBookmarkModal {...defaultProps} />);
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
  });
});
