import { useOvermind } from 'app/overmind';
import css from '@styled-system/css';
import React from 'react';
import {
  Integration,
  Text,
  Element,
  Stack,
  Button,
  Collapsible,
} from '@codesandbox/components';
import { GitHubIcon } from './Icons';

export const GithubLogin = () => {
  const {
    actions: { signInGithubClicked },
    state: { isLoadingGithub },
  } = useOvermind();

  return (
    <Collapsible title="Github" defaultOpen>
      <Element paddingX={2}>
        <Text variant="muted" marginBottom={4} block>
          You can create commits and open pull requests if you add GitHub to
          your integrations.
        </Text>
        <Integration Icon={GitHubIcon} title="GitHub">
          <Element
            marginX={2}
            css={css({
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gridGap: 4,
            })}
          >
            <Stack direction="vertical">
              <Text variant="muted">Enables</Text>
              <Text>Commits & PRs</Text>
            </Stack>
            <Button
              disabled={isLoadingGithub}
              onClick={() => signInGithubClicked()}
            >
              Sign In
            </Button>
          </Element>
        </Integration>
      </Element>
    </Collapsible>
  );
};
