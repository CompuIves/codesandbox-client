import React, { useEffect } from 'react';
import { useOvermind } from 'app/overmind';
import { sandboxesTypes } from 'app/overmind/namespaces/dashboard/state';
import { Stack, Text, Element } from '@codesandbox/components';
import css from '@styled-system/css';
import { Header } from 'app/pages/NewDashboard/Components/Header';
import {
  SandboxGrid,
  SkeletonGrid,
} from 'app/pages/NewDashboard/Components/SandboxGrid';
import { SelectionProvider } from 'app/pages/NewDashboard/Components/Selection';

export const StartSandboxes = () => {
  const {
    actions,
    state: {
      dashboard: { sandboxes },
    },
  } = useOvermind();

  useEffect(() => {
    actions.dashboard.getPage(sandboxesTypes.START_PAGE);
  }, [actions.dashboard]);

  const items = [
    { type: 'header', title: 'Recently Used Templates' },
    ...(sandboxes.TEMPLATE_START_PAGE || []).map(template => {
      const { sandbox, ...templateValues } = template;
      return {
        type: 'sandbox',
        ...sandbox,
        isTemplate: true,
        template: templateValues,
      };
    }),
    { type: 'header', title: 'Your Recent Sandboxes' },
    { type: 'new-sandbox' },
    ...(sandboxes.RECENT_START_PAGE || []).map(sandbox => ({
      type: 'sandbox',
      ...sandbox,
    })),
  ];

  return (
    <SelectionProvider
      sandboxes={[
        ...(sandboxes.TEMPLATE_START_PAGE || []),
        ...(sandboxes.RECENT_START_PAGE || []),
      ]}
    >
      <Header title="Start" />

      {sandboxes.RECENT_START_PAGE ? (
        <>
          <SandboxGrid items={items} />
        </>
      ) : (
        <Stack as="section" direction="vertical" gap={8}>
          <Element css={css({ height: 4 })} />
          <section>
            <Text marginLeft={4}>Recently Used Templates</Text>
            <SkeletonGrid count={4} />
          </section>
          <section>
            <Text marginLeft={4}>Your Recent Sandboxes</Text>
            <SkeletonGrid count={4} />
          </section>
        </Stack>
      )}
    </SelectionProvider>
  );
};
