import React, { useEffect } from 'react';
import { Element, Text } from '@codesandbox/components';
import { useOvermind } from 'app/overmind';
import { SandboxCard } from 'app/pages/NewDashboard/Components/SandboxCard';
import { Loading } from 'app/pages/NewDashboard/Components/Loading';

export const Deleted = () => {
  const {
    actions,
    state: {
      user,
      dashboard: { deletedSandboxesByTime, loadingPage },
    },
  } = useOvermind();

  useEffect(() => {
    actions.dashboard.getDeletedSandboxes();
  }, [actions.dashboard, user]);

  return (
    <Element style={{ position: 'relative' }}>
      <Text marginBottom={2} block>
        Recently Deleted
      </Text>
      <Text variant="muted" block marginBottom={11}>
        Sandboxes, Templates and Folders are permanently deleted after 30 days{' '}
      </Text>
      {!loadingPage ? (
        <>
          {deletedSandboxesByTime.week.length && (
            <Element marginBottom={14}>
              <Text marginBottom={6} block>
                Archived this week
              </Text>
              {deletedSandboxesByTime.week.map(sandbox => (
                <SandboxCard sandbox={sandbox} key={sandbox.id} />
              ))}
            </Element>
          )}
          {deletedSandboxesByTime.older.length && (
            <>
              <Text marginBottom={6} block>
                Archived Earlier
              </Text>
              {deletedSandboxesByTime.older.map(sandbox => (
                <SandboxCard sandbox={sandbox} key={sandbox.id} />
              ))}
            </>
          )}
        </>
      ) : (
        <Loading />
      )}
    </Element>
  );
};
