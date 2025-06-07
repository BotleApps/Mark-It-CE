import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookmarkEditModal } from './BookmarkEditModal'; // Adjust path as needed
import type { Bookmark } from '../types'; // Adjust path as needed

const mockExistingBookmark: Bookmark = {
  id: 'bm-123',
  title: 'Existing Bookmark Title',
  url: 'https://existing.example.com',
  createdAt: new Date().toISOString(),
};

describe('BookmarkEditModal Component', () => {
  let mockOnClose: jest.Mock;
  let mockOnSave: jest.Mock;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSave = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const defaultProps = {
    // isOpen prop is not used by the component, parent controls rendering
    onClose: mockOnClose,
    onSave: mockOnSave,
    bookmark: mockExistingBookmark,
    theme: 'light' as 'light' | 'dark',
  };

  test('renders correctly with pre-filled title and URL inputs, and buttons', () => {
    render(<BookmarkEditModal {...defaultProps} />);
    expect(screen.getByText('Edit Bookmark')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockExistingBookmark.title)).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockExistingBookmark.url)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument(); // Corrected button text
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('input fields (title, URL) update internal state', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    const urlInput = screen.getByLabelText('URL') as HTMLInputElement;

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Test Title');
    expect(titleInput.value).toBe('Updated Test Title');

    await user.clear(urlInput);
    await user.type(urlInput, 'https://updated.example.com');
    expect(urlInput.value).toBe('https://updated.example.com');
  });

  test('Save Changes button calls onSave with updated bookmark data when inputs are valid', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);

    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' }); // Corrected

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://updatedurl.com');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockExistingBookmark,
      title: 'Updated Title',
      url: 'https://updatedurl.com',
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Enter key in URL input calls onSave when inputs are valid', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title via Enter URL');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://updatedenterurl.com');
    // userEvent.keyboard('{enter}') should work if urlInput is focused after typing
    // but to be sure, we can target the element explicitly for the event
    fireEvent.keyDown(urlInput, { key: 'Enter', code: 'Enter', charCode: 13 });


    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockExistingBookmark.id,
        title: 'Updated Title via Enter URL',
        url: 'https://updatedenterurl.com',
      })
    );
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Enter key in Title input calls onSave when inputs are valid', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title via Enter Title');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://updatedentertitle.com');
    fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockExistingBookmark.id,
        title: 'Updated Title via Enter Title',
        url: 'https://updatedentertitle.com',
      })
    );
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Validation Tests
  test('does not call onSave and shows error if title is empty', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' }); // Corrected

    await user.clear(titleInput);
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not call onSave and shows error if title is only whitespace', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' }); // Corrected

    await user.clear(titleInput);
    await user.type(titleInput, '   ');
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not call onSave and shows error if URL is empty', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' }); // Corrected

    await user.clear(urlInput);
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('URL is required.')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not call onSave and shows error if URL is invalid', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' }); // Corrected

    await user.clear(urlInput);
    await user.type(urlInput, 'invalid-url');
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('Invalid URL.')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('error message is cleared on subsequent valid submission attempt', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Save Changes' }); // Corrected

    await user.clear(urlInput);
    await user.type(urlInput, 'invalid-url');
    await user.click(saveButton);
    expect(screen.getByText('Invalid URL.')).toBeInTheDocument();

    await user.clear(urlInput);
    await user.type(urlInput, 'https://valid-updated.example.com');
    // Ensure title is also valid
    if ((titleInput as HTMLInputElement).value.trim() === '') {
        await user.clear(titleInput); // Should already be pre-filled from bookmark prop
        await user.type(titleInput, mockExistingBookmark.title); // Restore or set valid title
    }
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Invalid URL.')).not.toBeInTheDocument();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('Clicking the backdrop calls onClose', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    const backdropElement = screen.getByText('Edit Bookmark').closest('div.fixed.inset-0');

    expect(backdropElement).toBeInTheDocument();
    if (backdropElement) {
      await user.click(backdropElement);
    }
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Escape key calls onClose', async () => {
    const user = userEvent.setup();
    render(<BookmarkEditModal {...defaultProps} />);
    screen.getByLabelText('Title').focus();
    await user.keyboard('{escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('title input is focused on mount', async () => {
    render(<BookmarkEditModal {...defaultProps} />);
    const titleInput = screen.getByLabelText('Title');
    // The eslint-disable-next-line comment for testing-library/no-node-access that was here previously
    // is removed because the linter reported it as unused (though it also reported the error it was meant to suppress).
    await waitFor(() => expect(titleInput).toHaveFocus());
  });

  test('Inputs have associated labels for accessibility', () => {
    render(<BookmarkEditModal {...defaultProps} />);
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
  });
});
