import { Avatar, Stack, Text, Element } from '@codesandbox/components';
import { CommentFragment } from 'app/graphql/types';
import { formatDistance } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import React from 'react';

export const AvatarBlock: React.FC<{ comment: CommentFragment }> = ({
  comment,
}) => (
  <Stack gap={2} align="center">
    <Element itemprop="author" itemscope="" itemtype="http://schema.org/Person">
      <Avatar user={comment.user} />
    </Element>
    <Stack direction="vertical" justify="center" gap={1}>
      <Text itemprop="name" size={3} weight="bold" variant="body">
        {comment.user.username}
      </Text>
      <Text
        size={2}
        variant="muted"
        itemprop="dateCreated"
        datetime={comment.insertedAt.toString()}
      >
        {formatDistance(
          zonedTimeToUtc(comment.insertedAt, 'Etc/UTC'),
          new Date(),
          {
            addSuffix: true,
          }
        )}
      </Text>
    </Stack>
  </Stack>
);
