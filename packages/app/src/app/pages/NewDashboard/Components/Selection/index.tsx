import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useOvermind } from 'app/overmind';
import { Element } from '@codesandbox/components';
import css from '@styled-system/css';
import {
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_DOWN,
  ARROW_UP,
  ENTER,
} from '@codesandbox/common/lib/utils/keycodes';
import { sandboxUrl } from '@codesandbox/common/lib/utils/url-generator';
import { DragPreview } from './DragPreview';

const Context = React.createContext({
  sandboxes: [],
  selectedIds: [],
  onClick: (event: React.MouseEvent<HTMLDivElement>, itemId: string) => {},
  onBlur: (event: React.FocusEvent<HTMLDivElement>) => {},
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {},
  onDragStart: (event: React.MouseEvent<HTMLDivElement>, itemId: string) => {},
  onDrop: (droppedResult: any) => {},
  thumbnailRef: null,
  isDragging: false,
});

export const SelectionProvider = ({
  sandboxes = [],
  folders = [],
  ...props
}) => {
  const selectionItems = [
    ...(folders || []).map(folder => folder.path),
    ...(sandboxes || []).map(sandbox => sandbox.id),
  ];
  const [selectedIds, setSelectedIds] = React.useState([]);

  const {
    state: { dashboard },
    actions,
  } = useOvermind();

  const onClick = (event: React.MouseEvent<HTMLDivElement>, itemId: string) => {
    if (event.ctrlKey || event.metaKey) {
      // select multiple with modifier

      if (selectedIds.includes(itemId)) {
        setSelectedIds(selectedIds.filter(id => id !== itemId));
      } else {
        setSelectedIds([...selectedIds, itemId]);
      }

      event.stopPropagation();
    } else if (event.shiftKey) {
      // start = find index for last inserted
      // end = find index for itemId
      // find everything in between and add them
      const start = selectionItems.findIndex(
        id => id === selectedIds[selectedIds.length - 1]
      );
      const end = selectionItems.findIndex(id => id === itemId);

      const itemsInRange = [];

      if (start >= 0 && end >= 0) {
        const increment = end > start ? +1 : -1;

        for (
          let index = start;
          increment > 0 ? index <= end : index >= end;
          index += increment
        ) {
          itemsInRange.push(selectionItems[index]);
        }
      } else {
        itemsInRange.push(itemId);
      }

      // Missing feature: When you create a new selection that overlaps
      // with the existing selection, you're probably trying to unselect them
      // commonIds = itemsInRange.filter(id => selectedIds.length)
      // remove the common ones while adding the rest

      setSelectedIds([...selectedIds, ...itemsInRange]);

      event.stopPropagation();
    } else {
      setSelectedIds([itemId]);
      event.stopPropagation();
    }
  };

  const onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.bubbles) {
      // do nothing, another sandbox was selected
    } else {
      // reset selection
      setSelectedIds([]);
    }
  };

  const onContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // global blur
    setSelectedIds([]);
  };

  let viewMode: string;
  const location = useLocation();

  if (location.pathname.includes('deleted')) viewMode = 'list';
  else if (location.pathname.includes('start')) viewMode = 'grid';
  else viewMode = dashboard.viewMode;

  const history = useHistory();
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!selectedIds.length) return;

    // if only one thing is selected, open it
    if (event.keyCode === ENTER && selectedIds.length === 1) {
      const selectedId = selectedIds[0];

      let url;
      if (selectedId.startsWith('/')) {
        // means its a folder
        url = '/new-dashboard/all' + selectedId;
      } else {
        const seletedSandbox = sandboxes.find(
          sandbox => sandbox.id === selectedId
        );
        url = sandboxUrl({
          id: seletedSandbox.id,
          alias: seletedSandbox.alias,
        });
      }

      if (event.ctrlKey || event.metaKey) {
        window.open(url, '_blank');
      } else {
        history.push(url);
      }
    }

    // if isn't one of the handled keys, skip
    if (
      (viewMode === 'grid' &&
        event.keyCode !== ARROW_RIGHT &&
        event.keyCode !== ARROW_LEFT) ||
      (viewMode === 'list' &&
        event.keyCode !== ARROW_DOWN &&
        event.keyCode !== ARROW_UP)
    ) {
      return;
    }

    // cancel scroll events
    event.preventDefault();

    const lastSelectedItemId = selectedIds[selectedIds.length - 1];

    const index = selectionItems.findIndex(id => id === lastSelectedItemId);

    const direction = [ARROW_RIGHT, ARROW_DOWN].includes(event.keyCode)
      ? 'forward'
      : 'backward';

    const nextItem = selectionItems[index + (direction === 'forward' ? 1 : -1)];

    // boundary conditions
    if (!nextItem) return;

    // scroll to newly selected element into view imperatively
    scrollIntoViewport(nextItem);

    // just moving around
    if (!event.shiftKey) {
      setSelectedIds([nextItem]);
      return;
    }

    // selection:
    // going back! remove the last one
    if (selectedIds.includes(nextItem)) {
      setSelectedIds(selectedIds.slice(0, -1));
      return;
    }

    // select one more
    setSelectedIds([...selectedIds, nextItem]);
  };

  const onDragStart = (
    event: React.MouseEvent<HTMLDivElement>,
    itemId: string
  ) => {
    // if the dragged sandbox isn't selected. select it alone
    if (!selectedIds.includes(itemId)) {
      setSelectedIds([itemId]);
    }
  };

  const onDrop = dropResult => {
    const sandboxIds = selectedIds.filter(isSandboxId);
    const folderPaths = selectedIds.filter(isFolderPath);

    if (dropResult.path === 'deleted') {
      actions.dashboard.deleteSandbox(sandboxIds);
      folderPaths.forEach(path => actions.dashboard.deleteFolder({ path }));
    } else if (dropResult.path === 'templates') {
      actions.dashboard.makeTemplate(sandboxIds);
    } else if (dropResult.path === 'drafts') {
      actions.dashboard.addSandboxesToFolder({
        sandboxIds,
        collectionPath: '/',
      });
    } else {
      actions.dashboard.addSandboxesToFolder({
        sandboxIds,
        collectionPath: dropResult.path,
      });
      // moving folders into another folder
      // is the same as changing it's path
      folderPaths.forEach(path => {
        const { name } = folders.find(folder => folder.path === path);
        actions.dashboard.renameFolder({
          path,
          newPath: dropResult.path + '/' + name,
        });
      });
    }
  };

  // attach to thumbnail, we use this to calculate size
  const thumbnailRef = React.useRef<HTMLDivElement>();

  // is anything being dragged?
  const [isDragging, setDragging] = React.useState(false);

  return (
    <Context.Provider
      value={{
        sandboxes,
        selectedIds,
        onClick,
        onBlur,
        onKeyDown,
        onDragStart,
        onDrop,
        thumbnailRef,
        isDragging,
      }}
    >
      <Element
        onClick={onContainerClick}
        css={css({ paddingX: 4, paddingY: 10 })}
      >
        {props.children}
      </Element>
      <DragPreview
        sandboxes={sandboxes || []}
        folders={folders || []}
        selectionItems={selectionItems}
        selectedIds={selectedIds}
        thumbnailRef={thumbnailRef}
        viewMode={viewMode}
        setDragging={setDragging}
      />
    </Context.Provider>
  );
};

export const useSelection = () => {
  const {
    sandboxes,
    selectedIds,
    onClick,
    onBlur,
    onKeyDown,
    onDragStart,
    onDrop,
    thumbnailRef,
    isDragging,
  } = React.useContext(Context);

  return {
    sandboxes,
    selectedIds,
    onClick,
    onBlur,
    onKeyDown,
    onDragStart,
    onDrop,
    thumbnailRef,
    isDragging,
  };
};

const scrollIntoViewport = (id: string) => {
  // we use data attributes to target element
  const element = document.querySelector(`[data-selection-id="${id}"]`);

  // if it's outside viewport, scroll to it
  const { top, bottom } = element.getBoundingClientRect();
  if (bottom > window.innerHeight || top < 0) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const isFolderPath = id => id.startsWith('/');
const isSandboxId = id => !id.startsWith('/');
