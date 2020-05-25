import { Stack } from '@codesandbox/components';
import { useOvermind } from 'app/overmind';
import { sandboxesTypes } from 'app/overmind/namespaces/dashboard/state';
import { Header } from 'app/pages/NewDashboard/Components/Header';
import { SelectionProvider } from 'app/pages/NewDashboard/Components/Selection';
import React from 'react';

import { SandboxesGroup, SkeletonGroup } from './SandboxesGroup';

export const Recent = () => {
  const {
    actions,
    state: {
      dashboard: { sandboxes },
    },
  } = useOvermind();

  React.useEffect(() => {
    actions.dashboard.getPage(sandboxesTypes.RECENT);
  }, [actions.dashboard]);

  return (
    <SelectionProvider sandboxes={sandboxes.RECENT}>
      <Header />
      <section style={{ position: 'relative' }}>
        {sandboxes.RECENT ? (
          <Stack as="section" direction="vertical" gap={8}>
            <SandboxesGroup title="Today" time="day" />
            <SandboxesGroup title="Last 7 Days" time="week" />
            <SandboxesGroup title="Earlier this month" time="month" />
            <SandboxesGroup title="Older" time="older" />
          </Stack>
        ) : (
          <Stack as="section" direction="vertical" gap={8}>
            <SkeletonGroup title="Today" time="day" />
            <SkeletonGroup title="Last 7 Days" time="week" />
            <SkeletonGroup title="Earlier this month" time="month" />
            <SkeletonGroup title="Older" time="older" />
          </Stack>
        )}
      </section>
    </SelectionProvider>
  );
};
