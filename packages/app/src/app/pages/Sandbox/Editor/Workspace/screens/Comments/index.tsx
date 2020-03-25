import { CommentsFilterOption } from '@codesandbox/common/lib/types';
import {
  Icon,
  List,
  Menu,
  SidebarRow,
  Stack,
  Text,
} from '@codesandbox/components';
import { css } from '@styled-system/css';
import { useOvermind } from 'app/overmind';
import { OPTIMISTIC_COMMENT_ID } from 'app/overmind/namespaces/comments/state';
import React from 'react';

import { AddComment } from './AddComment';
import { Comment } from './Comment';
import { CommentDialog } from './Dialog';

export const Comments: React.FC = () => {
  const {
    state: {
      comments: {
        selectedCommentsFilter,
        currentComments,
        currentCommentId,
        multiCommentsSelector,
      },
    },
    actions: { comments: commentsActions },
  } = useOvermind();
  const options = Object.values(CommentsFilterOption);
  const commentsExceptOptimistic = currentComments.filter(
    comment => comment.id !== OPTIMISTIC_COMMENT_ID
  );
  const getSelectedFilter = () => {
    switch (selectedCommentsFilter) {
      case CommentsFilterOption.ALL || CommentsFilterOption.OPEN:
        return 'new';
      case CommentsFilterOption.RESOLVED:
        return 'resolved';
      default:
        return 'new';
    }
  };

  const Empty = () => (
    <Stack
      direction="vertical"
      align="center"
      justify="center"
      gap={8}
      marginX={2}
    >
      <Icon
        name="comments"
        size={80}
        color="mutedForeground"
        css={{ opacity: 0.2 }}
      />
      <div>
        <Text block align="center" variant="muted">
          There are no {getSelectedFilter()} comments.
        </Text>
        <Text block align="center" variant="muted">
          Comment on code by clicking within a file, or add a comment below.
        </Text>
      </div>
    </Stack>
  );

  return (
    <Stack
      direction="vertical"
      justify="space-between"
      css={{ height: '100%' }}
    >
      <div css={{ overflow: 'hidden' }}>
        <SidebarRow
          justify="space-between"
          paddingX={2}
          css={css({
            borderBottom: '1px solid',
            borderColor: 'sideBar.border',
            minHeight: '35px',
          })}
        >
          <Text>Comments</Text>
          <Menu>
            <Menu.IconButton
              className="icon-button"
              name="filter"
              title="Filter comments"
              size={12}
            />
            <Menu.List>
              {options.map(option => (
                <Menu.Item
                  key={option}
                  onSelect={() => commentsActions.selectCommentsFilter(option)}
                >
                  {option}
                </Menu.Item>
              ))}
            </Menu.List>
          </Menu>
        </SidebarRow>

        {commentsExceptOptimistic.length ? (
          <List
            marginTop={4}
            css={{
              // stretch within container, leaving space for comment box
              height: 'calc(100% - 32px)',
              overflow: 'auto',
            }}
          >
            {commentsExceptOptimistic.map(comment => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </List>
        ) : null}
      </div>
      {commentsExceptOptimistic.length ? null : <Empty />}
      <AddComment />
      {currentCommentId && <CommentDialog />}
      {multiCommentsSelector && (
        <ul
          style={{
            position: 'fixed',
            left: multiCommentsSelector.x,
            top: multiCommentsSelector.y,
            backgroundColor: 'red',
            zIndex: 999999999999999,
          }}
        >
          {multiCommentsSelector.ids.map(id => (
            <li key={id}>
              <button
                type="button"
                onClick={() => commentsActions.selectComment(id)}
              >
                {id}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  );
};
