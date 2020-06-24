import React from 'react';
import { useDragLayer } from 'react-dnd';
import { motion } from 'framer-motion';
import { Stack, Text } from '@codesandbox/components';
import { getSandboxName } from '@codesandbox/common/lib/utils/get-sandbox-name';
import css from '@styled-system/css';
import { SIDEBAR_WIDTH } from '../../Sidebar/constants';
import { getTemplateIcon } from '../Sandbox/TemplateIcon';
import {
  DashboardSandbox,
  DashboardTemplate,
  DashboardFolder,
} from '../../types';
import { Position } from '.';

interface DragPreviewProps {
  sandboxes: Array<DashboardSandbox | DashboardTemplate>;
  folders: Array<DashboardFolder>;
  selectionItems: string[];
  selectedIds: string[];
  viewMode: 'list' | 'grid';
  thumbnailRef: React.RefObject<HTMLDivElement>;
  setDragging: (value: boolean) => void;
}

export const DragPreview: React.FC<DragPreviewProps> = React.memo(
  ({
    sandboxes,
    folders,
    selectionItems,
    selectedIds,
    viewMode,
    thumbnailRef,
    setDragging,
  }) => {
    const { isDragging, initialOffset, currentOffset } = useDragLayer(
      monitor => ({
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
      })
    );

    setDragging(isDragging);
    React.useEffect(() => {
      // if (isDragging) debugger;
    }, [isDragging]);

    // can be a sandbox or folder
    const selectedItems = React.useMemo(
      () =>
        selectionItems
          .filter(id => selectedIds.includes(id))
          .map(id => {
            if (id.startsWith('/')) {
              const folder = folders.find(f => f.path === id);
              return {
                type: 'folder',
                title: folder.name,
                path: folder.path,
              };
            }

            const sandbox = sandboxes.find(s => s.sandbox.id === id)!.sandbox;

            let screenshotUrl = sandbox.screenshotUrl;
            // We set a fallback thumbnail in the API which is used for
            // both old and new dashboard, we can move this logic to the
            // backend when we deprecate the old dashboard
            if (
              screenshotUrl === 'https://codesandbox.io/static/img/banner.png'
            ) {
              screenshotUrl = '/static/img/default-sandbox-thumbnail.png';
            }

            const TemplateIcon = getTemplateIcon(sandbox);

            return {
              type: 'sandbox',
              id: sandbox.id,
              title: getSandboxName(sandbox),
              url: screenshotUrl,
              Icon: TemplateIcon,
            };
          })
          .slice(0, 4),
      [folders, sandboxes, selectedIds, selectionItems]
    );

    const mousePosition = useMousePosition();

    const thumbnailSize = React.useMemo(() => {
      if (!thumbnailRef.current) {
        return { width: 0, height: 0 };
      }

      const thumbnailRect = thumbnailRef.current.getBoundingClientRect();
      return { width: thumbnailRect.width, height: thumbnailRect.height };
    }, [thumbnailRef]);

    const animatedStyles = React.useMemo(
      () =>
        getItemStyles({
          initialOffset,
          currentOffset,
          viewMode,
          thumbnailSize,
          mousePosition,
        }),
      [initialOffset, currentOffset, viewMode, thumbnailSize, mousePosition]
    );

    return (
      <Stack
        css={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 100,
          left: 0,
          top: 0,
        }}
      >
        {isDragging && (
          <Stack
            gap={2}
            direction={viewMode === 'list' ? 'vertical' : 'horizontal'}
            as={motion.div}
            css={css({
              position: 'absolute',
              border: viewMode === 'list' ? '1px solid' : 'none',
              borderColor: 'grays.700',
              padding: viewMode === 'list' ? 2 : 0,
              borderRadius: 'medium',
              boxShadow: 2,
            })}
            initial={animatedStyles}
            animate={animatedStyles}
            transition={{
              type: 'spring',
              damping: 100,
              stiffness: 1000,
            }}
          >
            {selectedItems.map((item, index) => (
              <Stack gap={2} align="center" key={item.id || item.path}>
                <Stack
                  justify="center"
                  align="center"
                  css={css({
                    position: viewMode === 'list' ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    width: viewMode === 'list' ? 32 : '100%',
                    height: viewMode === 'list' ? 32 : '100%',
                    backgroundColor: 'grays.600',
                    backgroundImage: item.url ? `url(${item.url})` : null,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: viewMode === 'list' ? 'small' : 'medium',
                    transform:
                      viewMode === 'list' ? null : `rotate(${index * 2.5}deg)`,
                  })}
                >
                  {item.type === 'folder' ? (
                    <svg
                      width="100%"
                      height={viewMode === 'list' ? 24 : '33%'}
                      fill="none"
                      viewBox="0 0 56 49"
                    >
                      <path
                        fill="#6CC7F6"
                        d="M20.721 0H1.591A1.59 1.59 0 000 1.59v45.82C0 48.287.712 49 1.59 49h52.82A1.59 1.59 0 0056 47.41V7.607a1.59 1.59 0 00-1.59-1.59H28L21.788.41A1.59 1.59 0 0020.72 0z"
                      />
                    </svg>
                  ) : null}
                  {item.type === 'sandbox' && !item.url ? (
                    <Stack
                      css={{ svg: { filter: 'grayscale(1)', opacity: 0.1 } }}
                    >
                      <item.Icon
                        // @ts-ignore
                        width={viewMode === 'list' ? 16 : 60}
                        height={viewMode === 'list' ? 16 : 60}
                      />
                    </Stack>
                  ) : null}
                </Stack>

                {viewMode === 'list' ? (
                  <Text size={3} weight="medium" css={{ flexShrink: 0 }}>
                    {item.title}
                  </Text>
                ) : null}
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    );
  }
);

function getItemStyles({
  initialOffset,
  currentOffset,
  viewMode,
  thumbnailSize,
  mousePosition,
}) {
  if (!initialOffset || !currentOffset) {
    return { display: 'none' };
  }

  let { x, y } = currentOffset;

  let size: {
    width: number | string;
    height: number | string;
    minWidth?: number;
  };

  // overlapping with sidebar
  const isOver = currentOffset && currentOffset.x < SIDEBAR_WIDTH;
  let backgroundColor = viewMode === 'list' ? 'rgba(36,36,36,1)' : null; // grays.600

  if (isOver) {
    if (viewMode === 'list') {
      backgroundColor = 'rgba(36,36,36,0.8)'; // grays.600 with 50% opacity
    } else {
      size = { width: 100, height: 50 };
    }
    x = mousePosition.x;
    y = mousePosition.y;
  } else if (viewMode === 'list') {
    size = { width: 'auto', minWidth: 160, height: 'fit-content' };
  } else {
    size = thumbnailSize;
  }

  return {
    x,
    y,
    backgroundColor,
    width: size.width,
    height: size.height,
    minWidth: size.minWidth,
  };
}

const useMousePosition = () => {
  const [position, setPosition] = React.useState<Position>({
    x: null,
    y: null,
  });

  React.useEffect(() => {
    const handler = event =>
      setPosition({
        x: event.clientX,
        y: event.clientY,
      });

    document.addEventListener('dragover', handler);
    return () => document.removeEventListener('dragover', handler);
  }, []);

  return position;
};
