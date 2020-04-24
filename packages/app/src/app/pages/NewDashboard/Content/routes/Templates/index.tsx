import { useOvermind } from 'app/overmind';
import React, { useEffect } from 'react';
import css from '@styled-system/css';
import { Header } from 'app/pages/NewDashboard/Components/Header';
import { Element, Grid } from '@codesandbox/components';
import { SandboxCard } from '../../../Components/SandboxCard';
import { Loading } from '../../../Components/Loading';

export const Templates = () => {
  const {
    actions,
    state: {
      dashboard: { templateSandboxes },
    },
  } = useOvermind();

  useEffect(() => {
    actions.dashboard.getTemplateSandboxes();
  }, [actions.dashboard]);

  return (
    <Element css={css({ position: 'relative' })}>
      <Header title="Templates" />
      {templateSandboxes ? (
        <Grid
          rowGap={6}
          columnGap={6}
          marginBottom={8}
          css={css({
            gridTemplateColumns: 'repeat(auto-fit,minmax(220px,0.2fr))',
          })}
        >
          {templateSandboxes.map(({ sandbox }) => (
            <SandboxCard template sandbox={sandbox} key={sandbox.id} />
          ))}
        </Grid>
      ) : (
        <Loading />
      )}
    </Element>
  );
};
