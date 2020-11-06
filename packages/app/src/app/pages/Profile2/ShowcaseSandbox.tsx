import React from 'react';
import { useOvermind } from 'app/overmind';
import { useDrop } from 'react-dnd';
import { Element, Button, Stack, Text, Icon } from '@codesandbox/components';
import designLanguage from '@codesandbox/components/lib/design-language/theme';
import { sandboxUrl } from '@codesandbox/common/lib/utils/url-generator';
import css from '@styled-system/css';
import { SandboxType, DropTarget } from './constants';

export const ShowcaseSandbox = () => {
  const {
    state: {
      profile: { showcasedSandbox },
      user: loggedInUser,
      profile: { current: user },
    },
    actions: {
      modalOpened,
      profile: { newSandboxShowcaseSelected },
    },
  } = useOvermind();

  const myProfile = loggedInUser?.username === user.username;

  const [{ isOver, canDrop, isDragging }, drop] = useDrop({
    accept: [SandboxType.ALL_SANDBOX, SandboxType.PINNED_SANDBOX],
    drop: () => ({ name: DropTarget.SHOWCASED_SANDBOX }),
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      isDragging: !!monitor.getItem(),
    }),
  });

  if (!showcasedSandbox && !myProfile) return null;

  return (
    <div ref={drop} style={{ position: 'relative', height: 360 }}>
      {showcasedSandbox && (
        <>
          <Element
            as="iframe"
            src={`https://${showcasedSandbox.id}.csb.app?standalone=1`}
            css={css({
              backgroundColor: 'white',
              width: '100%',
              position: 'absolute',
              top: 0,
              zIndex: 2,
              // reveal the drag area behind it
              height: isDragging && canDrop ? 0 : 360,
              borderRadius: '4px',
              border: '1px solid',
              borderColor: 'grays.600',
            })}
            scrolling="no"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
          <Stack
            gap={2}
            style={{
              position: 'absolute',
              width: 'auto',
              zIndex: 3,
              bottom: 16,
              right: 16,
              // hide when new sandbox is being dragged
              opacity: isDragging ? 0 : 1,
            }}
          >
            <Button
              as="a"
              autoWidth
              href={sandboxUrl({ id: showcasedSandbox.id })}
              variant="secondary"
            >
              Open sandbox
            </Button>
            {myProfile && (
              <Button
                variant="secondary"
                autoWidth
                onClick={() => newSandboxShowcaseSelected(null)}
              >
                <Icon name="trash" />
              </Button>
            )}
          </Stack>
        </>
      )}

      <Stack
        justify="center"
        align="center"
        onClick={() =>
          modalOpened({ modal: 'sandboxPicker', message: 'SHOWCASE' })
        }
        css={css({
          position: 'absolute',
          top: 0,
          zIndex: 1,
          width: '100%',
          height: 360,
          padding: 4,
          backgroundColor: isOver ? 'grays.700' : 'grays.900',
          transition: (theme: typeof designLanguage) =>
            `background-color ${theme.speeds[2]}`,
          backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='4' ry='4' stroke='%23757575' stroke-width='1' stroke-dasharray='8%2c8' stroke-dashoffset='4' stroke-linecap='square'/%3e%3c/svg%3e");border-radius: 4px;`,

          ':hover': {
            cursor: 'pointer',
            backgroundColor: 'grays.700',
          },
        })}
      >
        <Text variant="muted" size={4} weight="medium" align="center">
          Select a Sandbox or Drag a Sandbox here
          <br /> to set as interactive header
        </Text>
      </Stack>
    </div>
  );
};
