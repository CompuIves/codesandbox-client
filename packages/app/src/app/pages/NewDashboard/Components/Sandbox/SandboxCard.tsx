import React from 'react';
import {
  Stack,
  Element,
  Text,
  Stats,
  Input,
  SkeletonText,
} from '@codesandbox/components';
import css from '@styled-system/css';
import { MenuOptions } from './Menu';

export const SandboxCard = ({
  sandbox,
  isTemplate = false,
  sandboxTitle,
  newTitle,
  // interactions
  selected,
  onClick,
  onDoubleClick,
  onBlur,
  onKeyDown,
  // editing
  edit,
  inputRef,
  onChange,
  onInputKeyDown,
  onSubmit,
  onInputBlur,
  enterEditing,
  // drag preview
  thumbnailRef,
  opacity,
  ...props
}) => (
  <Stack
    direction="vertical"
    gap={2}
    onClick={onClick}
    onDoubleClick={onDoubleClick}
    onBlur={onBlur}
    onKeyDown={onKeyDown}
    {...props}
    css={css({
      width: '100%',
      height: 240,
      backgroundColor: 'grays.700',
      border: '1px solid',
      borderColor: selected ? 'blues.600' : 'grays.600',
      borderRadius: 'medium',
      overflow: 'hidden',
      transition: 'all ease-in-out',
      transitionDuration: theme => theme.speeds[4],
      opacity,
      ':hover, :focus, :focus-within': {
        cursor: edit ? 'normal' : 'pointer',
        boxShadow: theme => '0 4px 16px 0 ' + theme.colors.grays[900],
      },
    })}
  >
    <Element
      as="div"
      ref={thumbnailRef}
      css={css({
        height: 160,
        backgroundColor: 'grays.600',
        backgroundImage: `url(${sandbox.screenshotUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      })}
    />
    <Stack justify="space-between" align="center" marginLeft={4}>
      {edit ? (
        <form onSubmit={onSubmit}>
          <Input
            value={newTitle}
            ref={inputRef}
            onChange={onChange}
            onKeyDown={onInputKeyDown}
            onBlur={onInputBlur}
          />
        </form>
      ) : (
        <Text size={3} weight="medium">
          {sandboxTitle}
        </Text>
      )}
      <MenuOptions
        sandbox={sandbox}
        isTemplate={isTemplate}
        onRename={enterEditing}
      />
    </Stack>
    <Stack marginX={4}>
      <Stats
        css={css({ fontSize: 2 })}
        sandbox={{
          viewCount: sandbox.viewCount,
          likeCount: sandbox.likeCount,
          forkCount: sandbox.forkCount,
        }}
      />
    </Stack>
  </Stack>
);

export const SkeletonCard = () => (
  <Stack
    direction="vertical"
    gap={4}
    css={css({
      width: '100%',
      height: 240,
      border: '1px solid',
      borderColor: 'grays.600',
      borderRadius: 'medium',
      overflow: 'hidden',
      transition: 'all ease-in-out',
      transitionDuration: theme => theme.speeds[4],
    })}
  >
    <SkeletonText css={{ width: '100%', height: 160 }} />
    <Stack direction="vertical" gap={2} marginX={4}>
      <SkeletonText css={{ width: 120 }} />
      <SkeletonText css={{ width: 180 }} />
    </Stack>
  </Stack>
);
