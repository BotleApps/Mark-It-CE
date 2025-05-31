import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext, DragOverlay } from '@dnd-kit/core'; // DragOverlay might be needed if testing active drag item
import { BookmarkGroup as BookmarkGroupComponent } from './BookmarkGroup';
import type { BookmarkGroup as BookmarkGroupType, Bookmark, LinkTarget } from '../types';

// Mock child components
jest.mock('./BookmarkTile', () => ({
  BookmarkTile: jest.fn((props) => (
    <div data-testid={`bookmark-tile-${props.bookmark.id}`} data-bookmark-title={props.bookmark.title}>
      <span>{props.bookmark.title}</span>
      <button onClick={() => props.onEdit(props.bookmark)}>Edit Bookmark</button>
      <button onClick={() => props.onDelete(props.bookmark.id)}>Delete Bookmark</button>
      <button onClick={() => props.onMove('left')} disabled={props.isFirst}>Move Bookmark Left</button>
      <button onClick={() => props.onMove('right')} disabled={props.isLast}>Move Bookmark Right</button>
    </div>
  )),
}));

jest.mock('./AddBookmarkModal', () => ({
  AddBookmarkModal: jest.fn(({ onClose, onSave, groupId, spaceId, theme }) => (
    <div data-testid="add-bookmark-modal">
      <span>Add Bookmark Modal</span>
      <button onClick={onClose}>Close Add Modal</button>
      <button onClick={() => onSave({ title: 'New BM', url: 'https://new.com', createdAt: new Date().toISOString() }, groupId, spaceId)}>Save New Bookmark</button>
    </div>
  )),
}));

// BookmarkEditModal is not directly opened by BookmarkGroup, but by BookmarkTile's onEdit.

const mockBookmarksArray: Bookmark[] = [
  { id: 'bm1', title: 'Bookmark Alpha', url: 'https://alpha.com', createdAt: '2023-01-01' },
  { id: 'bm2', title: 'Bookmark Beta', url: 'https://beta.com', createdAt: '2023-01-02' },
];

const mockGroupData: BookmarkGroupType = {
  id: 'g1',
  name: 'Tech Reads',
  color: '#4CAF50', // Green
  bookmarks: mockBookmarksArray,
  isExpanded: true, // Though this component doesn't use it to show/hide bookmarks
};

describe('BookmarkGroup Component', () => {
  let mockOnEditGroup: jest.Mock;
  let mockOnDeleteGroup: jest.Mock;
  let mockOnAddBookmarkProp: jest.Mock; // The prop passed to BookmarkGroup
  let mockOnEditBookmark: jest.Mock;
  let mockOnDeleteBookmarkFromTile: jest.Mock; // From BookmarkTile
  let mockOnUpdateGroupProp: jest.Mock; // Prop for updating group (e.g. reordered bookmarks)
  let mockOnHandleMoveGroup: jest.Mock;

  const spaceId = 'space-alpha';

  beforeEach(() => {
    mockOnEditGroup = jest.fn();
    mockOnDeleteGroup = jest.fn();
    mockOnAddBookmarkProp = jest.fn();
    mockOnEditBookmark = jest.fn();
    mockOnDeleteBookmarkFromTile = jest.fn();
    mockOnUpdateGroupProp = jest.fn();
    mockOnHandleMoveGroup = jest.fn();

    (require('./BookmarkTile').BookmarkTile as jest.Mock).mockClear();
    (require('./AddBookmarkModal').AddBookmarkModal as jest.Mock).mockClear();
  });

  const defaultTestProps = {
    group: mockGroupData,
    spaceId: spaceId,
    onEditGroup: mockOnEditGroup,
    onDeleteGroup: mockOnDeleteGroup,
    onAddBookmark: mockOnAddBookmarkProp,
    onEditBookmark: mockOnEditBookmark,
    onDeleteBookmark: mockOnDeleteBookmarkFromTile,
    onUpdateGroup: mockOnUpdateGroupProp,
    onHandleMoveGroup: mockOnHandleMoveGroup,
    isFirst: false,
    isLast: false,
    theme: 'light' as 'light' | 'dark',
    linkTarget: '_self' as LinkTarget,
  };

  const renderWithDndContext = (ui: React.ReactElement) => {
    return render(<DndContext onDragEnd={() => {}}>{ui}</DndContext>);
  };

  test('renders group title and BookmarkTile components for each bookmark', () => {
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);
    expect(screen.getByText(mockGroupData.name)).toBeInTheDocument();
    expect(screen.getAllByTestId(/bookmark-tile-/)).toHaveLength(mockBookmarksArray.length);
    mockBookmarksArray.forEach(bm => {
      expect(screen.getByText(bm.title)).toBeInTheDocument();
    });
  });

  test('renders placeholder message when no bookmarks are present', () => {
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} group={{ ...mockGroupData, bookmarks: [] }} />);
    expect(screen.getByText(/Drag and drop Open Tabs here/i)).toBeInTheDocument();
  });

  test('Add Bookmark button opens AddBookmarkModal', async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);
    const addButton = screen.getByTitle('Add bookmark');

    await user.click(addButton);
    expect(screen.getByTestId('add-bookmark-modal')).toBeInTheDocument();
    expect(require('./AddBookmarkModal').AddBookmarkModal).toHaveBeenCalledTimes(1);
  });

  test('saving from AddBookmarkModal calls onAddBookmark prop and closes modal', async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);

    // Open the modal first
    const addBmButton = screen.getByTitle('Add bookmark');
    await user.click(addBmButton);
    expect(screen.getByTestId('add-bookmark-modal')).toBeInTheDocument();

    // Click the "Save New Bookmark" button inside the mocked AddBookmarkModal
    const saveModalButton = screen.getByText('Save New Bookmark');
    await user.click(saveModalButton);

    expect(mockOnAddBookmarkProp).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New BM', url: 'https://new.com' }),
      mockGroupData.id,
      spaceId
    );
    expect(screen.queryByTestId('add-bookmark-modal')).not.toBeInTheDocument(); // Modal should close
  });

  test('closing AddBookmarkModal calls its onClose', async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);
    const addBmButton = screen.getByTitle('Add bookmark');
    await user.click(addBmButton);

    const closeModalButton = screen.getByText('Close Add Modal'); // From mock
    await user.click(closeModalButton);
    expect(screen.queryByTestId('add-bookmark-modal')).not.toBeInTheDocument();
  });


  test('Group Settings button calls onEditGroup', async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);
    const settingsButton = screen.getByTitle('Group settings');
    await user.click(settingsButton);
    expect(mockOnEditGroup).toHaveBeenCalledWith(mockGroupData);
  });

  test('Delete Group button calls onDeleteGroup (no window.confirm here)', async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);
    const deleteButton = screen.getByTitle('Delete group');
    await user.click(deleteButton);
    // This component calls onDeleteGroup directly. Parent should confirm.
    expect(mockOnDeleteGroup).toHaveBeenCalledWith(mockGroupData.id);
  });

  test('Move Group Left (Up) button calls onHandleMoveGroup with "up"', async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);
    const moveUpButton = screen.getByTitle('Move group left'); // Corrected title
    await user.click(moveUpButton);
    expect(mockOnHandleMoveGroup).toHaveBeenCalledWith('up'); // Component calls with 'up'/'down'
  });

  test('Move Group Right (Down) button calls onHandleMoveGroup with "down"', async () => {
    const user = userEvent.setup();
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);
    const moveDownButton = screen.getByTitle('Move group right'); // Corrected title
    await user.click(moveDownButton);
    expect(mockOnHandleMoveGroup).toHaveBeenCalledWith('down');
  });

  test('Move Group Left (Up) button is disabled if isFirst is true', () => {
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} isFirst={true} />);
    expect(screen.getByTitle('Move group left')).toBeDisabled();
  });

  test('Move Group Right (Down) button is disabled if isLast is true', () => {
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} isLast={true} />);
    expect(screen.getByTitle('Move group right')).toBeDisabled();
  });

  test('props are passed down to BookmarkTile components correctly', () => {
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);
    expect(require('./BookmarkTile').BookmarkTile).toHaveBeenCalledTimes(mockBookmarksArray.length);

    mockBookmarksArray.forEach((bm, index) => {
      expect(require('./BookmarkTile').BookmarkTile).toHaveBeenNthCalledWith(
        index + 1,
        expect.objectContaining({
          bookmark: bm,
          groupColor: mockGroupData.color,
          onEdit: mockOnEditBookmark,
          onDelete: mockOnDeleteBookmarkFromTile,
          theme: defaultTestProps.theme,
          linkTarget: defaultTestProps.linkTarget,
          isFirst: index === 0,
          isLast: index === mockBookmarksArray.length - 1,
          // onMove prop of BookmarkTile is a function: (direction) => handleMoveBookmark(index, direction)
          // We can check if it's a function.
          onMove: expect.any(Function),
        }),
        {}
      );
    });
  });

  test('handleMoveBookmark (called by BookmarkTile) calls onUpdateGroup with reordered bookmarks', async () => {
    // This test simulates BookmarkTile's onMove calling the handleMoveBookmark function
    const user = userEvent.setup();
    renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);

    // Simulate moving the first bookmark ('bm1') to the right
    // Find the "Move Bookmark Right" button for the first bookmark.
    // The mock BookmarkTile creates these buttons.
    const firstBookmarkTile = screen.getByTestId(`bookmark-tile-${mockBookmarksArray[0].id}`);
    // eslint-disable-next-line testing-library/no-node-access
    const moveRightButtonInTile = within(firstBookmarkTile).getByText('Move Bookmark Right');

    await act(async () => {
      await user.click(moveRightButtonInTile);
    });

    expect(mockOnUpdateGroupProp).toHaveBeenCalledTimes(1);
    const expectedReorderedBookmarks = [mockBookmarksArray[1], mockBookmarksArray[0]]; // bm2, bm1
    expect(mockOnUpdateGroupProp).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockGroupData,
        bookmarks: expectedReorderedBookmarks,
      })
    );
  });

  // Test for isOver styling (basic)
  test('applies "isOver" styling when useDroppable indicates', () => {
    // Mock useDroppable to control isOver
    jest.mock('@dnd-kit/core', () => ({
      ...jest.requireActual('@dnd-kit/core'), // Import and retain default exports
      useDroppable: () => ({ setNodeRef: jest.fn(), isOver: true }),
    }));
    const { container } = renderWithDndContext(<BookmarkGroupComponent {...defaultTestProps} />);
    // Check for a class or style that is applied when isOver is true
    // From component: 'border-blue-500 bg-blue-500/10 scale-[1.02]' (light theme)
    // eslint-disable-next-line testing-library/no-node-access
    expect(container.firstChild).toHaveClass('border-blue-500', 'bg-blue-500/10', 'scale-[1.02]');
    jest.unmock('@dnd-kit/core'); // Unmock for other tests
  });
});

// Helper to query within a specific element, useful for child components
import { queries } from '@testing-library/dom';
function within(element: HTMLElement) {
  return Object.keys(queries).reduce((helpers, key) => {
    const query = queries[key as keyof typeof queries];
    // @ts-ignore
    helpers[key] = (...args) => query(element, ...args);
    return helpers;
  }, {} as typeof queries);
}
