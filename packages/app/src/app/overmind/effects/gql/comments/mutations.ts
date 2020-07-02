import {
  CreateCommentMutation,
  CreateCommentMutationVariables,
  DeleteCommentMutation,
  DeleteCommentMutationVariables,
  ResolveCommentMutation,
  ResolveCommentMutationVariables,
  UnresolveCommentMutation,
  UnresolveCommentMutationVariables,
  UpdateCommentMutation,
  UpdateCommentMutationVariables,
} from 'app/graphql/types';
import { gql, Query } from 'overmind-graphql';

import { commentFragment } from './fragments';

export const createComment: Query<
  CreateCommentMutation,
  CreateCommentMutationVariables
> = gql`
  mutation CreateComment(
    $id: ID
    $content: String!
    $sandboxId: ID!
    $parentCommentId: ID
    $codeReference: CodeReference
  ) {
    createComment(
      id: $id
      content: $content
      sandboxId: $sandboxId
      parentCommentId: $parentCommentId
      codeReference: $codeReference
    ) {
      ...Comment
    }
  }
  ${commentFragment}
`;

export const deleteComment: Query<
  DeleteCommentMutation,
  DeleteCommentMutationVariables
> = gql`
  mutation DeleteComment($commentId: ID!, $sandboxId: ID!) {
    deleteComment(commentId: $commentId, sandboxId: $sandboxId) {
      id
    }
  }
`;

export const updateComment: Query<
  UpdateCommentMutation,
  UpdateCommentMutationVariables
> = gql`
  mutation UpdateComment($commentId: ID!, $sandboxId: ID!, $content: String) {
    updateComment(
      commentId: $commentId
      sandboxId: $sandboxId
      content: $content
    ) {
      id
    }
  }
`;

export const resolveComment: Query<
  ResolveCommentMutation,
  ResolveCommentMutationVariables
> = gql`
  mutation ResolveComment($commentId: ID!, $sandboxId: ID!) {
    resolveComment(commentId: $commentId, sandboxId: $sandboxId) {
      id
    }
  }
`;

export const unresolveComment: Query<
  UnresolveCommentMutation,
  UnresolveCommentMutationVariables
> = gql`
  mutation UnresolveComment($commentId: ID!, $sandboxId: ID!) {
    unresolveComment(commentId: $commentId, sandboxId: $sandboxId) {
      id
    }
  }
`;
