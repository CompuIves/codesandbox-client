import Tooltip from '@codesandbox/common/lib/components/Tooltip';
import { LiveUser } from '@codesandbox/common/lib/types';
import { Avatar, Stack, Text } from '@codesandbox/components';
import React, { FunctionComponent } from 'react';

import { useOvermind } from 'app/overmind';

import { AddIcon, FollowIcon, RemoveIcon, UnfollowIcon } from '../icons';

type Props = {
  liveRole: 'editor' | 'owner' | 'spectator';
  user: LiveUser;
};
export const User: FunctionComponent<Props> = ({ liveRole, user }) => {
  const {
    actions: {
      live: { onAddEditorClicked, onFollow, onRemoveEditorClicked },
    },
    state: {
      live: {
        followingUserId,
        isOwner,
        liveUserId,
        roomInfo: { mode },
      },
    },
  } = useOvermind();

  const loggedInUser = user.id === liveUserId;

  // only owners can change editors
  // and only in classroom mode, in open mode, everyone is an editor
  const canChangeEditors = isOwner && mode === 'classroom';

  // you can't follow spectators (nothing to follow)
  // and you can't follow yourself
  const canFollowUser = !(liveRole === 'spectator' || loggedInUser);

  return (
    <Stack
      align="center"
      css={{
        '.live-actions': { opacity: 0 },
        ':hover': { '.live-actions': { opacity: 1 } },
      }}
      justify="space-between"
    >
      <Stack align="center" gap={2}>
        <Avatar
          css={{ img: { borderColor: `rgb(${user.color.join(',')})` } }}
          user={user}
        />

        <span>
          <Text block size={2}>
            {user.username}
          </Text>

          <Text block size={2} variant="muted">
            {liveRole === 'owner' ? 'Owner ' : null}

            {loggedInUser ? '(you)' : null}
          </Text>
        </span>
      </Stack>

      <Stack align="center" className="live-actions" gap={2}>
        {canChangeEditors ? (
          <>
            {liveRole === 'spectator' ? (
              <Tooltip content="Make editor">
                <AddIcon
                  css={{ cursor: 'pointer' }}
                  onClick={() => onAddEditorClicked(user.id)}
                />
              </Tooltip>
            ) : null}

            {liveRole === 'editor' ? (
              <Tooltip content="Make spectator">
                <RemoveIcon
                  css={{ cursor: 'pointer' }}
                  onClick={() => onRemoveEditorClicked(user.id)}
                />
              </Tooltip>
            ) : null}
          </>
        ) : null}

        {canFollowUser ? (
          <>
            {followingUserId === user.id ? (
              <Tooltip content="Stop following">
                <UnfollowIcon
                  css={{ cursor: 'pointer' }}
                  onClick={() => onFollow(null)}
                />
              </Tooltip>
            ) : (
              <Tooltip content="Follow along">
                <FollowIcon
                  css={{ cursor: 'pointer' }}
                  onClick={() => onFollow(user.id)}
                />
              </Tooltip>
            )}
          </>
        ) : null}
      </Stack>
    </Stack>
  );
};
