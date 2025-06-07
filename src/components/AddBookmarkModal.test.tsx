import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddBookmarkModal } from './AddBookmarkModal'; // Adjust path as needed

describe('AddBookmarkModal Component', () => {
  const mockGroupId = 'group-1-id';
  const mockSpaceId = 'space-1-id';
  const defaultTheme = 'light' as 'light' | 'dark';

  // beforeEach(() => {
    // Mock console.error for invalid URL constructor errors during tests
    // jest.spyOn(console, 'error').mockImplementation(() => {});
  // });

  // afterEach(() => {
    // jest.restoreAllMocks();
  // });

  test('renders correctly with title, URL inputs, and buttons', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    expect(screen.getByRole('heading', { name: 'Add Bookmark' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Bookmark' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('input fields (title, URL) update internal state', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    const urlInput = screen.getByLabelText('URL') as HTMLInputElement;

    await user.type(titleInput, 'My Test Title');
    expect(titleInput.value).toBe('My Test Title');

    await user.clear(urlInput);
    await user.type(urlInput, 'https://test.example.com');
    expect(urlInput.value).toBe('https://test.example.com');
  });

  test('Add Bookmark button calls onSave with new bookmark data and calls onClose when inputs are valid', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
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
        createdAt: expect.any(String),
      }),
      mockGroupId,
      mockSpaceId
    );
    const savedBookmarkArg = mockOnSave.mock.calls[0][0];
    expect(() => new Date(savedBookmarkArg.createdAt).toISOString()).not.toThrow();

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Enter key in URL input calls onSave and onClose when inputs are valid', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');

    await user.type(titleInput, 'Title via Enter');
    await user.type(urlInput, 'https://enterkey.com');
    await user.keyboard('{enter}');

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
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');

    await user.type(titleInput, 'Title via Enter');
    await user.type(urlInput, 'https://enterkey.com');
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
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    await user.type(urlInput, 'https://validurl.com');
    await user.click(saveButton);
    // screen.debug(undefined, 100000);

    expect(mockOnSave).not.toHaveBeenCalled();
    // screen.debug(undefined, 100000);
    await screen.findByText('Title is required.');
    // screen.debug(undefined, 100000);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not call onSave and shows error if title is only whitespace', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    await user.type(titleInput, '   ');
    await user.type(urlInput, 'https://validurl.com');
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    await screen.findByText('Title is required.');
    expect(mockOnClose).not.toHaveBeenCalled();
  });


  test('does not call onSave and shows error if URL is empty', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    const titleInput = screen.getByLabelText('Title');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    await user.type(titleInput, 'Valid Title');
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    await screen.findByText('URL is required.');
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not call onSave and shows error if URL is invalid', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    await user.type(titleInput, 'Valid Title');
    await user.type(urlInput, 'invalid-url');
    await user.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
    console.log('Attempting to find "Invalid URL." error message.');
    screen.debug(undefined, 300000);
    await screen.findByText('Invalid URL.');
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('error message is cleared on subsequent valid submission attempt', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    const titleInput = screen.getByLabelText('Title');
    const urlInput = screen.getByLabelText('URL');
    const saveButton = screen.getByRole('button', { name: 'Add Bookmark' });

    // First attempt: invalid URL
    await user.type(titleInput, 'Valid Title');
    await user.type(urlInput, 'invalid-url');
    await user.click(saveButton);
    console.log('Attempting to find "Invalid URL." error message (first attempt).');
    screen.debug(undefined, 300000);
    await screen.findByText('Invalid URL.');

    // Second attempt: valid URL
    await user.clear(urlInput);
    await user.type(urlInput, 'https://valid.example.com');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Invalid URL.')).not.toBeInTheDocument(); // Error should be cleared
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });


  test('Cancel button calls onClose', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('Clicking the backdrop calls onClose', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    const { container } = render( // Use container to get backdrop
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );

    // The outermost div is the backdrop
    // eslint-disable-next-line testing-library/no-node-access
    const backdropElement = container.firstChild as HTMLElement;
    expect(backdropElement).toBeInTheDocument();
    expect(backdropElement).toHaveClass('fixed', 'inset-0');

    if (backdropElement) { // Ensure backdropElement is not null
      await user.click(backdropElement);
    }
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

   test('Escape key calls onClose', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const user = userEvent.setup();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );

    screen.getByLabelText('Title').focus();
    await user.keyboard('{escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });


  test('title input is focused on mount', async () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    const titleInput = screen.getByLabelText('Title');
    await waitFor(() => expect(titleInput).toHaveFocus());
  });

  test('Inputs have associated labels for accessibility', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    render(
      <AddBookmarkModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        groupId={mockGroupId}
        spaceId={mockSpaceId}
        theme={defaultTheme}
      />
    );
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
  });
});
