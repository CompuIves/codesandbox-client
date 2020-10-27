import { GitFileCompare, SandboxGitState } from '@codesandbox/common/lib/types';
import { githubRepoUrl } from '@codesandbox/common/lib/utils/url-generator';
import {
  Button,
  Collapsible,
  Element,
  Link,
  List,
  ListItem,
  Select,
  Stack,
  Text,
} from '@codesandbox/components';
import { useOvermind } from 'app/overmind';
import React from 'react';

import { Changes } from './Changes';
import { CommitForm } from './CommitForm';
import { ClosedPr } from './components/ClosedPr';
import {
  CommitToMaster,
  CommitToPr,
  NoPermissions,
} from './components/CommitText';
import {
  BothModifiedConflict,
  SandboxDeletedConflict,
  SandboxDeletedSourceModifiedConflict,
  SandboxModifiedConflict,
  SourceDeletedConflict,
} from './components/ConflictButtons';
import { ConflictsPRBase } from './components/ConflictPRBase';
import { ConflictsSource } from './components/ConflictsSource';
import { OutOfSync, OutOfSyncPR } from './components/ConflictText';
import { Loading } from './components/Loading';
import { MergedPr } from './components/MergedPr';
import { CreateRepo } from './CreateRepo';
import { GithubLogin } from './GithubLogin';
import { GitHubIcon } from './Icons';
import { NotLoggedIn } from './NotLoggedIn';
import { NotOwner } from './NotOwner';
import { ConflictType } from './types';
import { getConflictIcon } from './utils/getConflictIcon';
import { getConflictText } from './utils/getConflictsText';
import { getConflictType } from './utils/getConflictType';

export const GitHub = () => {
  const {
    state: {
      git: {
        gitChanges,
        gitState,
        conflicts,
        permission,
        isFetching,
        isExported,
        pr,
        isLinkingToGitSandbox,
        forks,
      },
      editor: {
        currentSandbox: {
          id,
          originalGit,
          baseGit,
          owned,
          originalGitCommitSha,
          prNumber,
          forkedTemplateSandbox,
          forkedFromSandbox,
        },
        modulesByPath,
      },
      isLoggedIn,
      user,
    },
    actions,
  } = useOvermind();

  const changeCount = gitChanges
    ? gitChanges.added.length +
      gitChanges.modified.length +
      gitChanges.deleted.length
    : 0;

  const conflictPaths = conflicts.map(conflict => '/' + conflict.filename);

  if (!isLoggedIn) return <NotLoggedIn />;
  if (!owned) return <NotOwner />;
  if (!user.integrations.github) return <GithubLogin />;
  if (isFetching || isExported) return <Loading />;
  if (pr && pr.merged) return <MergedPr />;
  if (pr && pr.state === 'closed') return <ClosedPr />;

  function getConflictButtons(conflict: GitFileCompare) {
    const conflictType = getConflictType(conflict, modulesByPath);

    if (conflictType === ConflictType.SOURCE_ADDED_SANDBOX_DELETED) {
      return <SandboxDeletedConflict conflict={conflict} />;
    }
    if (conflictType === ConflictType.SOURCE_ADDED_SANDBOX_MODIFIED) {
      return <SandboxModifiedConflict conflict={conflict} />;
    }
    if (conflictType === ConflictType.SOURCE_DELETED_SANDBOX_MODIFIED) {
      return <SourceDeletedConflict conflict={conflict} />;
    }
    if (conflictType === ConflictType.SOURCE_MODIFIED_SANDBOX_MODIFIED) {
      return <BothModifiedConflict conflict={conflict} />;
    }
    if (conflictType === ConflictType.SOURCE_MODIFIED_SANDBOX_DELETED) {
      return <SandboxDeletedSourceModifiedConflict conflict={conflict} />;
    }

    return null;
  }

  function getText() {
    if (gitState === SandboxGitState.OUT_OF_SYNC_SOURCE) {
      return <OutOfSync />;
    }

    if (gitState === SandboxGitState.OUT_OF_SYNC_PR_BASE) {
      return <OutOfSyncPR />;
    }

    if (conflicts.length && gitState === SandboxGitState.CONFLICT_SOURCE) {
      return (
        <ConflictsSource
          prNumber={prNumber}
          baseGit={baseGit}
          originalGit={originalGit}
          originalGitCommitSha={originalGitCommitSha}
        />
      );
    }
    if (conflicts.length && gitState === SandboxGitState.CONFLICT_PR_BASE) {
      return (
        <ConflictsPRBase
          baseGit={baseGit}
          originalGit={originalGit}
          originalGitCommitSha={originalGitCommitSha}
        />
      );
    }
    if (!prNumber && (permission === 'admin' || permission === 'write')) {
      return <CommitToMaster />;
    }

    if (prNumber) {
      return <CommitToPr />;
    }

    return <NoPermissions />;
  }

  function getContent() {
    if (conflicts.length) {
      return (
        <Collapsible title={`Conflicts (${conflictPaths.length})`} defaultOpen>
          <Element>
            <Stack direction="vertical">
              <List paddingBottom={6}>
                {conflicts.map(conflict => (
                  <ListItem
                    gap={2}
                    key={conflict.filename}
                    marginBottom={4}
                    css={{ display: 'block' }}
                  >
                    <Stack gap={3} align="center" marginBottom={4}>
                      {getConflictIcon(conflict, modulesByPath)}
                      <Text variant="muted">{conflict.filename}</Text>
                    </Stack>
                    <Text paddingBottom={4} size={3} block>
                      {getConflictText(
                        gitState === SandboxGitState.CONFLICT_PR_BASE
                          ? baseGit.branch
                          : originalGit.branch,
                        conflict,
                        modulesByPath
                      )}
                    </Text>
                    {getConflictButtons(conflict)}
                  </ListItem>
                ))}
              </List>
            </Stack>
          </Element>
        </Collapsible>
      );
    }

    if (
      conflictPaths.length ||
      gitChanges.added.length ||
      gitChanges.deleted.length ||
      gitChanges.modified.length
    ) {
      return (
        <Collapsible title={`Changes (${changeCount})`} defaultOpen>
          <Element>
            <Changes conflicts={conflictPaths} {...gitChanges} />
            <CommitForm />
          </Element>
        </Collapsible>
      );
    }

    return (
      <Collapsible title={`Changes (${changeCount})`} defaultOpen>
        <Stack align="center" justify="center" padding={3}>
          <Text size={4}>No changes</Text>
        </Stack>
      </Collapsible>
    );
  }

  // If there's a forkedFromSandbox we use that, otherwise we use the forkedTemplateSandbox
  const upstreamSandbox = forkedFromSandbox || forkedTemplateSandbox;
  if (!originalGit && upstreamSandbox?.git) {
    return (
      <>
        <Collapsible title="Link to GitHub repository" defaultOpen>
          <Element paddingX={2}>
            <Text variant="muted">If you wish to contribute back to</Text>{' '}
            {upstreamSandbox.git.username}/{upstreamSandbox.git.repo}
            <Text variant="muted">
              , you can link this sandbox to the GitHub repository. This will
              allow you to create commits and open pull requests with this
              sandbox.
            </Text>
            <Button
              marginTop={4}
              onClick={() => actions.git.linkToGitSandbox(id)}
              loading={isLinkingToGitSandbox}
            >
              Link Sandbox
            </Button>
          </Element>
        </Collapsible>
        <CreateRepo />
      </>
    );
  }

  return originalGit ? (
    <>
      {originalGit ? (
        <>
          <Collapsible title="GitHub repository" defaultOpen>
            <Element paddingX={2}>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={githubRepoUrl(originalGit)}
              >
                <Stack gap={2} marginBottom={4} align="center">
                  <GitHubIcon width={20} />
                  <Text size={2}>
                    {originalGit.username}/{originalGit.repo}
                  </Text>
                </Stack>
              </Link>
              <Element marginBottom={3}>
                <Select
                  onChange={({ target: { value } }) => {
                    if (value === 'fork') {
                      actions.editor.forkExternalSandbox({
                        sandboxId: baseGit
                          ? `/github/${baseGit.username}/${baseGit.repo}/${baseGit.path}`
                          : `/github/${originalGit.username}/${originalGit.repo}/${originalGit.path}`,
                      });
                    } else if (value === 'source') {
                      actions.git.openSourceSandbox();
                    } else {
                      actions.git.openSandboxFork(value);
                    }
                  }}
                >
                  <option value="fork">
                    New fork from{' '}
                    {baseGit ? baseGit.branch : originalGit.branch}...
                  </option>
                  <option disabled>──────────</option>
                  <option value="source">
                    {baseGit ? baseGit.branch : originalGit.branch} sandbox
                  </option>
                  <option disabled>──────────</option>
                  {forks.map((fork, index) => (
                    <option
                      key={fork.id}
                      value={fork.id}
                      selected={index === 0}
                    >
                      {fork.title || fork.id}{' '}
                      {index === 0 ? ' (current)' : null}
                      {index > 0 && typeof fork.prNumber === 'number'
                        ? ' (pr)'
                        : null}
                    </option>
                  ))}
                  <option value={1}>strange-jones-frfp8 (pr)</option>
                  <option value={2}>strange-jones-frfp8</option>
                </Select>
              </Element>
              {getText()}
            </Element>
          </Collapsible>
          {getContent()}
          <CreateRepo />
        </>
      ) : (
        <>
          <CreateRepo />
        </>
      )}
    </>
  ) : (
    <CreateRepo />
  );
};
