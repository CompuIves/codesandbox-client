import React from 'react';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import {
  Grid,
  Column,
  Stack,
  Element,
  Text,
  Input,
  ListAction,
  SkeletonText,
  Tooltip,
} from '@codesandbox/components';
import css from '@styled-system/css';
import { MenuOptions } from './Menu';

export const SandboxListItem = ({
  sandbox,
  sandboxTitle,
  isTemplate = false,
  // interactions
  selected,
  onClick,
  onDoubleClick,
  onBlur,
  onKeyDown,
  // edit mode
  newTitle,
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
  <ListAction
    align="center"
    onClick={onClick}
    onDoubleClick={onDoubleClick}
    onBlur={onBlur}
    onKeyDown={onKeyDown}
    {...props}
    css={css({
      paddingX: 0,
      opacity,
      height: 64,
      borderBottom: '1px solid',
      borderBottomColor: 'grays.600',
      overflow: 'hidden',
      boxShadow: theme =>
        selected ? `0px 0px 1px 1px ${theme.colors.blues[600]}` : null,
    })}
  >
    <Grid css={{ width: '100%' }}>
      <Column span={[12, 5, 5]}>
        <Stack gap={4} align="center">
          <Element
            as="div"
            ref={thumbnailRef}
            css={css({
              borderRadius: 'small',
              height: 32,
              width: 32,
              marginLeft: 2,
              backgroundImage: `url(${sandbox.screenshotUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              border: '1px solid',
              borderColor: 'grays.600',
              flexShrink: 0,
            })}
          />
          <Element style={{ width: 150 }}>
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
              <Tooltip label={sandboxTitle}>
                <Text size={3} weight="medium" maxWidth="100%">
                  {sandboxTitle}
                </Text>
              </Tooltip>
            )}
          </Element>
        </Stack>
      </Column>
      <Column span={[0, 4, 4]} as={Stack} align="center">
        {sandbox.removedAt ? (
          <Text size={3} variant="muted" maxWidth="100%">
            <Text css={css({ display: ['none', 'none', 'inline'] })}>
              Deleted
            </Text>{' '}
            {formatDistanceToNow(new Date(sandbox.removedAt))} ago
          </Text>
        ) : (
          <Text size={3} variant="muted" maxWidth="100%">
            <Text css={css({ display: ['none', 'none', 'inline'] })}>
              Updated
            </Text>{' '}
            {formatDistanceToNow(new Date(sandbox.updatedAt))} ago
          </Text>
        )}
      </Column>
      <Column span={[0, 3, 3]} as={Stack} align="center">
        <Text size={3} variant="muted" maxWidth="100%">
          {sandbox.source.template}
        </Text>
      </Column>
    </Grid>
    <MenuOptions
      sandbox={sandbox}
      isTemplate={isTemplate}
      onRename={enterEditing}
    />
  </ListAction>
);

export const SkeletonListItem = () => (
  <Stack
    paddingX={2}
    align="center"
    justify="space-between"
    css={css({
      height: 64,
      paddingX: 2,
      borderBottom: '1px solid',
      borderBottomColor: 'grays.600',
    })}
  >
    <Stack align="center" gap={4}>
      <SkeletonText css={{ height: 32, width: 32 }} />
      <SkeletonText css={{ width: 120 }} />
    </Stack>
    <SkeletonText css={{ width: 120 }} />
    <SkeletonText
      css={{
        width: 26,
        /* keep menu for justify, but hide it from user */
        opacity: 0,
      }}
    />
  </Stack>
);
