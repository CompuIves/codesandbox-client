import React, { useEffect } from 'react';
import { sortBy } from 'lodash-es';
import { useQuery, useMutation, useApolloClient } from '@apollo/react-hooks';
import { DelayedAnimation } from 'app/components/DelayedAnimation';
import { Button } from '@codesandbox/common/lib/components/Button';
import { sandboxUrl } from '@codesandbox/common/lib/utils/url-generator';
import history from 'app/utils/history';
import track from '@codesandbox/common/lib/utils/analytics';
import { ContextMenu } from 'app/components/ContextMenu';
import CustomTemplate from '@codesandbox/common/lib/components/CustomTemplate';
import { getSandboxName } from '@codesandbox/common/lib/utils/get-sandbox-name';
import { LIST_BOOKMARKED_TEMPLATES_QUERY } from 'app/components/CreateNewSandbox/queries';
import {
  UnbookmarkTemplateFromDashboardMutation,
  UnbookmarkTemplateFromDashboardMutationVariables,
  ListPersonalBookmarkedTemplatesQuery,
} from 'app/graphql/types';
import { useOvermind } from 'app/overmind';
import { ButtonContainer } from './elements';

import { Grid, EmptyTitle } from '../elements';
import { Navigation } from '../Navigation';
import { UNBOOKMARK_TEMPLATE_FROM_DASHBOARD } from './mutations';

type BookmarkedTemplatesProps = { teamId?: string };

export const BookmarkedTemplates = (props: BookmarkedTemplatesProps) => {
  const { teamId } = props;

  const { actions } = useOvermind();

  const { loading, error, data } = useQuery<
    ListPersonalBookmarkedTemplatesQuery
  >(LIST_BOOKMARKED_TEMPLATES_QUERY);
  const client = useApolloClient();
  const [unBookmark] = useMutation<
    UnbookmarkTemplateFromDashboardMutation,
    UnbookmarkTemplateFromDashboardMutationVariables
  >(UNBOOKMARK_TEMPLATE_FROM_DASHBOARD, {
    onCompleted({ unbookmarkTemplate: unbookmarkMutation }) {
      const newTemplates = data.me.bookmarkedTemplates.filter(
        template => template.id !== unbookmarkMutation.id
      );
      client.writeData({
        data: {
          ...data,
          me: {
            ...data.me,
            bookmarkedTemplates: newTemplates,
          },
        },
      });
    },
  });

  useEffect(() => {
    document.title = `${
      teamId ? 'Team' : 'My'
    } Bookmarked Templates - CodeSandbox`;
  }, [teamId]);

  const sortedTemplates = React.useMemo(() => {
    if (data && data.me) {
      if (teamId) {
        const team = data.me.teams.find(t => t.id === teamId);
        return team.bookmarkedTemplates;
      }

      return data.me.bookmarkedTemplates;
    }

    return undefined;
  }, [teamId, data]);

  if (error) {
    console.error(error);
    return <div>Error!</div>;
  }

  if (loading || !sortedTemplates) {
    return (
      <DelayedAnimation
        delay={0.6}
        style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        Fetching Templates...
      </DelayedAnimation>
    );
  }
  const orderedTemplates = sortBy(sortedTemplates, template =>
    getSandboxName(template.sandbox).toLowerCase()
  );

  return (
    <>
      <Navigation bookmarked teamId={teamId} number={orderedTemplates.length} />
      {!orderedTemplates.length && (
        <div>
          <EmptyTitle>
            <p style={{ marginBottom: '0.5rem' }}>
              You don{"'"}t have any bookmarked templates yet. You can discover
              new templates on Template Universe!
            </p>
            <ButtonContainer>
              <Button small href="/docs/templates" secondary>
                Learn more
              </Button>
              <Button
                small
                onClick={() => {
                  actions.openCreateSandboxModal({});
                }}
              >
                Explore
              </Button>
            </ButtonContainer>
          </EmptyTitle>
        </div>
      )}
      <Grid>
        {orderedTemplates.map((template, i) => (
          <ContextMenu
            items={[
              {
                title: 'Unbookmark Template',
                action: () => {
                  track('Template - Unbookmarked', { source: 'Context Menu' });
                  if (teamId) {
                    unBookmark({
                      variables: { teamId, template: template.id },
                    });
                  } else {
                    unBookmark({
                      variables: {
                        template: template.id,
                        teamId: undefined,
                      },
                    });
                  }
                  return true;
                },
              },
            ]}
            key={template.id}
          >
            <CustomTemplate
              i={i}
              template={template}
              onClick={() => history.push(sandboxUrl(template.sandbox))}
            />
          </ContextMenu>
        ))}
      </Grid>
    </>
  );
};
