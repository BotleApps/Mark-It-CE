import React from 'react';
import { render, screen } from '@testing-library/react'; // Removed fireEvent
import userEvent from '@testing-library/user-event';
import { BookmarkTile } from './BookmarkTile'; // Adjust path as needed
import type { Bookmark, LinkTarget } from '../types'; // Adjust path as needed

const mockBookmark: Bookmark = {
  id: 'bm-1',
  title: 'Test Bookmark Title',
  url: 'https://example.com/test-page',
  createdAt: new Date().toISOString(),
  // Favicon is not directly rendered by this component based on its code
};

describe('BookmarkTile Component', () => {
  let mockOnEdit: jest.Mock;
  let mockOnDelete: jest.Mock;
  let mockOnMove: jest.Mock;
  let windowOpenSpy: jest.SpyInstance;

  beforeEach(() => {
    mockOnEdit = jest.fn();
    mockOnDelete = jest.fn();
    mockOnMove = jest.fn();
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null); // Mock window.open
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  const defaultProps = {
    bookmark: mockBookmark,
    groupColor: '#4A90E2', // Example blue
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onMove: mockOnMove,
    isFirst: false,
    isLast: false,
    linkTarget: '_self' as LinkTarget,
    theme: 'light' as 'light' | 'dark',
  };

  test('renders bookmark title and URL correctly', () => {
    render(<BookmarkTile {...defaultProps} />);

    expect(screen.getByText(mockBookmark.title)).toBeInTheDocument();
    expect(screen.getByText(mockBookmark.url)).toBeInTheDocument(); // URL is also visible
  });

  test('tile click opens link with correct URL and linkTarget="_self"', async () => {
    const user = userEvent.setup();
    render(<BookmarkTile {...defaultProps} linkTarget="_self" />);
    // eslint-disable-next-line testing-library/no-node-access
    const tile = screen.getByText(mockBookmark.title).closest('div.group')!;

    await user.click(tile);
    expect(windowOpenSpy).toHaveBeenCalledWith(mockBookmark.url, '_self', 'noopener,noreferrer');
  });

  test('tile click opens link with correct URL and linkTarget="_blank"', async () => {
    const user = userEvent.setup();
    render(<BookmarkTile {...defaultProps} linkTarget="_blank" />);
    // eslint-disable-next-line testing-library/no-node-access
    const tile = screen.getByText(mockBookmark.title).closest('div.group')!;

    await user.click(tile);
    expect(windowOpenSpy).toHaveBeenCalledWith(mockBookmark.url, '_blank', 'noopener,noreferrer');
  });

  test('action buttons (edit, delete, move) are present', () => {
    render(<BookmarkTile {...defaultProps} />);
    // Buttons are identified by title attribute due to icon-only content
    expect(screen.getByTitle('Edit bookmark')).toBeInTheDocument();
    expect(screen.getByTitle('Delete bookmark')).toBeInTheDocument();
    expect(screen.getByTitle('Move left')).toBeInTheDocument();
    expect(screen.getByTitle('Move right')).toBeInTheDocument();
  });


  test('clicking the edit button calls onEdit with bookmark data', async () => {
    const user = userEvent.setup();
    render(<BookmarkTile {...defaultProps} />);
    const editButton = screen.getByTitle('Edit bookmark');

    await user.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockBookmark);
  });

  test('clicking the delete button calls onDelete with bookmark id', async () => {
    const user = userEvent.setup();
    render(<BookmarkTile {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete bookmark');

    await user.click(deleteButton);
    // No window.confirm in this component, parent should handle confirmation if needed
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockBookmark.id);
  });

  test('clicking move left button calls onMove with "left"', async () => {
    const user = userEvent.setup();
    render(<BookmarkTile {...defaultProps} />);
    const moveLeftButton = screen.getByTitle('Move left');
    await user.click(moveLeftButton);
    expect(mockOnMove).toHaveBeenCalledWith('left');
  });

  test('clicking move right button calls onMove with "right"', async () => {
    const user = userEvent.setup();
    render(<BookmarkTile {...defaultProps} />);
    const moveRightButton = screen.getByTitle('Move right');
    await user.click(moveRightButton);
    expect(mockOnMove).toHaveBeenCalledWith('right');
  });

  test('move left button is disabled if isFirst is true', () => {
    render(<BookmarkTile {...defaultProps} isFirst={true} />);
    expect(screen.getByTitle('Move left')).toBeDisabled();
  });

  test('move right button is disabled if isLast is true', () => {
    render(<BookmarkTile {...defaultProps} isLast={true} />);
    expect(screen.getByTitle('Move right')).toBeDisabled();
  });

  test('renders with dark theme specific styles (basic check)', () => {
    render(<BookmarkTile {...defaultProps} theme="dark" />);
    // This test primarily ensures the component renders without crashing when theme="dark".
    // Specific style/class assertions would require knowledge of theme implementation details
    // or adding specific data-testid attributes for theme-dependent root elements.
    expect(screen.getByText(mockBookmark.title)).toBeInTheDocument();
    // If specific dark theme classes were applied to the root 'div.group', one might test:
    // const tileRoot = screen.getByText(mockBookmark.title).closest('div.group');
    // expect(tileRoot).toHaveClass('expected-dark-theme-class');
  });

  test('action buttons stop propagation of click events', async () => {
    const user = userEvent.setup();
    render(<BookmarkTile {...defaultProps} />);
    const editButton = screen.getByTitle('Edit bookmark');

    await user.click(editButton);
    // window.open (from handleTileClick) should not have been called
    // because the click on the button should have stopped propagation.
    expect(windowOpenSpy).not.toHaveBeenCalled();
    expect(mockOnEdit).toHaveBeenCalledTimes(1); // Ensure edit was still called
  });
});
