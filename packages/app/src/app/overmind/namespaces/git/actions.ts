import { getModulePath } from '@codesandbox/common/lib/sandbox/modules';
import {
  GitChanges,
  GitFileCompare,
  GitInfo,
  Module,
  SandboxGitState,
} from '@codesandbox/common/lib/types';
import {
  captureException,
  logBreadcrumb,
} from '@codesandbox/common/lib/utils/analytics/sentry';
import { convertTypeToStatus } from '@codesandbox/common/lib/utils/notifications';
import { hasPermission } from '@codesandbox/common/lib/utils/permission';
import { NotificationStatus } from '@codesandbox/notifications/lib/state';
import { Context } from 'app/overmind';
import { debounce, pipe } from 'overmind';

import * as internalActions from './internalActions';
import { createDiff } from './utils';

export const internal = internalActions;

export const repoTitleChanged = (
  { state }: Context,
  {
    title,
  }: {
    title: string;
  }
) => {
  state.git.repoTitle = title;
  state.git.error = null;
};

/**
 * There are two states the Sandbox can be in:
 * 1. It has been forked and the SOURCE is the GIT details of the Sandbox it forked from
 * 2. It has been forked and the SOURCE is the PR created
 *
 * To give indication of what file changes has been made, we do the following:
 * 1. First we load the SOURCE sandbox. We need this to indicate what you have changed in your sandbox
 * 2. Every time you make a change to the files we go through modules/directories of the source sandbox and your sandbox to produce a diff
 *
 * The steps that is taken to find "out of sync" and "conflict", is the following:
 * 1. We first want to compare your sandbox with the SOURCE (This being the GIT info on the sandbox you forked from or the PR)
 * 2. We pass the "originalGitCommitSha" and the branch of the SOURCE
 * 3. Now we evaluate the comparison against your files to see if anything is "out of sync" or in "conflict" and if so we break out and tell user
 * 4. If you sandbox has a PR we want to compare your sandbox with the BASE (This being the GIT info your sanbox forked from)
 * 5. We pass the "originalGitCommitSha" and the branch of the BASE
 * 6. Now we evaluate the comparison against your files to see if anything is "out of sync" or in "conflict" and if so we break out and tell user
 */
export const loadGitSource = async ({ state, actions, effects }: Context) => {
  const sandbox = state.editor.currentSandbox!;
  state.git.isExported = false;
  state.git.pr = null;
  state.git.repoTitle = '';

  if (
    !state.user ||
    !state.user.integrations.github ||
    !sandbox.originalGit ||
    !hasPermission(sandbox.authorization, 'write_code')
  ) {
    return;
  }

  state.git.isFetching = true;

  // We go grab the current version of the source
  try {
    await actions.git._loadSourceSandbox();
  } catch (error) {
    actions.internal.handleError({
      error,
      message:
        'Could not load the source sandbox for this GitHub sandbox, please refresh or report the issue.',
    });
    return;
  }

  try {
    state.git.permission = await effects.api.getGitRights(sandbox.id);
  } catch (error) {
    actions.internal.handleError({
      error,
      message:
        'Could not get information about your permissions, please refresh or report the issue.',
    });
    return;
  }

  // Now let us compare whatever has changed between our current
  // state and the source
  try {
    await actions.git._compareWithSource();
  } catch (error) {
    actions.internal.handleError({
      error,
      message:
        'We were not able to compare the content with the source, please refresh or report the issue.',
    });
    return;
  }

  if (state.git.gitState === SandboxGitState.SYNCED && sandbox.prNumber) {
    try {
      await actions.git._compareWithBase();
    } catch (error) {
      actions.internal.handleError({
        error,
        message:
          'We were not able to compare the content with the PR, please refresh or report the issue.',
      });
      return;
    }
  }

  actions.git._setGitChanges();
  state.git.isFetching = false;
};

export const createRepoClicked = async ({
  state,
  effects,
  actions,
}: Context) => {
  effects.analytics.track('GitHub - Create Repo');
  const { repoTitle } = state.git;
  const modulesNotSaved = !state.editor.isAllModulesSynced;

  if (!repoTitle) {
    state.git.error = 'Repo name cannot be empty';
    return;
  }

  if (/\s/.test(repoTitle.trim())) {
    state.git.error = 'Repo name cannot contain spaces';
    return;
  }

  if (modulesNotSaved) {
    state.git.error = 'All files need to be saved';
    return;
  }

  state.git.isExported = false;
  state.currentModal = 'exportGithub';

  const sandbox = state.editor.currentSandbox;
  if (!sandbox) {
    return;
  }

  try {
    const githubData = await effects.git.export(sandbox);
    if (!githubData) {
      return;
    }
    const git = await effects.api.createGit(sandbox.id, repoTitle, githubData);

    if (!git) {
      effects.notificationToast.error(
        'Unable to create git repo, please try again'
      );
      return;
    }

    git.commitSha = null;
    state.git.isExported = true;
    state.currentModal = null;

    effects.router.updateSandboxUrl({ git });
  } catch (error) {
    actions.internal.handleError({
      error,
      message:
        'Unable to create the repo. Please refresh and try again or report issue.',
    });
  }
};

export const importFromGithub = async (
  { state, effects, actions }: Context,
  sandboxUrl: string
) => {
  actions.modalClosed();
  state.currentModal = 'exportGithub';
  try {
    await actions.editor.forkExternalSandbox({
      sandboxId: sandboxUrl.replace('/s/', ''),
    });
    state.currentModal = null;
  } catch (e) {
    if (!state.user || !state.user.integrations?.github) {
      state.currentModal = null;
      effects.notificationToast.add({
        title: 'Can not import repo',
        message: 'This seems to be a private repo, you have to sign in first',
        status: NotificationStatus.ERROR,
        actions: {
          primary: {
            label: 'Sign in',
            run: () => {
              actions.signInGithubClicked();
            },
          },
        },
      });
    }
    throw e;
  }
};

export const openSourceSandbox = ({ state, effects }: Context) => {
  effects.analytics.track('GitHub - Open Source Sandbox');
  const git = state.editor.currentSandbox!.baseGit
    ? state.editor.currentSandbox!.baseGit
    : state.editor.currentSandbox!.originalGit;

  effects.router.updateSandboxUrl({ git });
};

/*
  Due to us creating new urls when syncing source, we have to move these updates
  from the source back to the sandbox
*/
export const _updateBinaryUploads = async (
  { state, actions }: Context,
  changes: GitChanges
) => {
  const binariesToUpdate = changes.added
    .filter(change => change.encoding === 'base64')
    .concat(changes.modified.filter(change => change.encoding === 'base64'));

  await Promise.all(
    binariesToUpdate.map(change => {
      const module = state.editor.modulesByPath[change.path] as Module;
      const sourceModule = state.git.sourceModulesByPath[change.path];

      actions.editor.codeChanged({
        moduleShortid: module.shortid,
        code: sourceModule.code,
      });
      return actions.editor.codeSaved({
        moduleShortid: module.shortid,
        code: sourceModule.code,
        cbID: null,
      });
    })
  );
};

export const createCommitClicked = async ({
  state,
  effects,
  actions,
}: Context) => {
  effects.analytics.track('GitHub - Create Commit');
  const sandbox = state.editor.currentSandbox!;
  const git = state.git;

  git.isCommitting = true;

  try {
    if (git.gitState === SandboxGitState.SYNCED) {
      await actions.git._compareWithSource();

      if (sandbox.prNumber && git.gitState === SandboxGitState.SYNCED) {
        await actions.git._compareWithBase();
      }

      if (state.git.gitState !== SandboxGitState.SYNCED) {
        git.isCommitting = false;
        return;
      }
    }

    const changes = await actions.git._getGitChanges();
    const commit = await effects.api.createGitCommit(
      sandbox.id,
      `${git.title}\n${git.description}`,
      changes,
      // If we have resolved a conflict and it is a PR source conflict, we need to commit
      // it with a reference to the conflicting sha as well
      git.gitState === SandboxGitState.RESOLVED_PR_BASE && git.baseCommitSha
        ? [git.sourceCommitSha!, git.baseCommitSha]
        : [git.sourceCommitSha!]
    );

    // We need to load the source again as it has now changed. We can not optimistically deal with
    // this, cause you might have added a binary
    sandbox.originalGit!.commitSha = commit.sha;
    sandbox.originalGitCommitSha = commit.sha;
    await actions.git._loadSourceSandbox();
    await actions.git._updateBinaryUploads(changes);
    actions.git._setGitChanges();
    state.git.isCommitting = false;
    state.git.title = '';
    state.git.description = '';
    state.git.conflicts = [];
    state.git.gitState = SandboxGitState.SYNCED;

    effects.notificationToast.success('Successfully created your commit');
  } catch (error) {
    state.git.isCommitting = false;

    if (error.message.includes('code 422')) {
      if (!sandbox.originalGit) return;
      effects.notificationToast.add({
        message: `You do not seem to have access to commit to ${sandbox.originalGit.username}/${sandbox.originalGit.repo}. Please read the documentation to grant access.`,
        title: 'Error creating commit',
        status: NotificationStatus.ERROR,
        actions: {
          primary: {
            label: 'Open documentation',
            run: () => {
              effects.browser.openWindow(
                'docs/git#committing-to-organizations'
              );
            },
          },
        },
      });
    } else {
      actions.internal.handleError({
        error,
        message:
          'We were unable to create your commit. Please try again or report the issue.',
      });
    }
  }
};

export const titleChanged = ({ state }: Context, title: string) => {
  state.git.title = title;
};

export const descriptionChanged = ({ state }: Context, description: string) => {
  state.git.description = description;
};

export const createPrClicked = async ({ state, effects, actions }: Context) => {
  effects.analytics.track('GitHub - Open PR');
  const git = state.git;
  git.isCreatingPr = true;
  git.pr = null;
  const sandbox = state.editor.currentSandbox!;
  const { id } = sandbox;

  try {
    if (git.gitState === SandboxGitState.SYNCED) {
      await actions.git._compareWithSource();

      if (state.git.gitState !== SandboxGitState.SYNCED) {
        git.isCreatingPr = false;
        return;
      }
    }

    const changes = await actions.git._getGitChanges();
    const pr = await effects.api.createGitPr(
      id,
      state.git.title,
      state.git.description,
      changes
    );

    sandbox.baseGit = {
      ...sandbox.originalGit,
    } as GitInfo;
    sandbox.baseGitCommitSha = sandbox.originalGit!.commitSha;
    sandbox.originalGit = {
      branch: pr.branch,
      commitSha: pr.commitSha,
      repo: pr.repo,
      username: pr.username,
      path: '',
    };
    sandbox.originalGitCommitSha = pr.commitSha;
    sandbox.prNumber = pr.number;
    git.pr = pr;

    await actions.git._loadSourceSandbox();
    await actions.git._updateBinaryUploads(changes);
    actions.git._setGitChanges();

    git.title = '';
    git.description = '';
    state.git.conflicts = [];
    state.git.gitState = SandboxGitState.SYNCED;

    git.isCreatingPr = false;

    effects.notificationToast.add({
      title: 'Successfully created your PR',
      message: '',
      status: convertTypeToStatus('success'),
      actions: {
        primary: {
          label: 'Open PR',
          run: () => {
            effects.browser.openWindow(
              `https://github.com/${sandbox.baseGit!.username}/${
                sandbox.baseGit!.repo
              }/pull/${sandbox.prNumber!}`
            );
          },
        },
      },
    });
  } catch (error) {
    git.isCreatingPr = false;
    actions.internal.handleError({
      error,
      message:
        'We were unable to create your PR. Please try again or report the issue.',
    });
  }
};

export const updateGitChanges = pipe(debounce(500), ({ actions }: Context) => {
  actions.git._setGitChanges();
});

export const resolveConflicts = async (
  { state, actions, effects }: Context,
  module: Module
) => {
  const conflict = state.git.conflicts.find(
    conflictItem => module.path === '/' + conflictItem.filename
  );

  if (conflict && module.code.indexOf('<<<<<<< CodeSandbox') === -1) {
    state.git.conflicts.splice(state.git.conflicts.indexOf(conflict), 1);

    await actions.editor.codeSaved({
      moduleShortid: module.shortid,
      code: module.code,
      cbID: null,
    });

    effects.analytics.track('GitHub - Resolve Conflicts');
    actions.git._tryResolveConflict();
  }
};

export const addConflictedFile = async (
  { state, actions }: Context,
  conflict: GitFileCompare
) => {
  state.git.conflictsResolving.push(conflict.filename);
  await actions.files.createModulesByPath({
    files: {
      [conflict.filename]: { content: conflict.content!, isBinary: false },
    },
  });
  state.git.sourceModulesByPath[
    '/' + conflict.filename
  ].code = conflict.content!;

  state.git.conflictsResolving.splice(
    state.git.conflictsResolving.indexOf(conflict.filename),
    1
  );
  state.git.conflicts.splice(state.git.conflicts.indexOf(conflict), 1);

  actions.git._tryResolveConflict();
};

export const ignoreConflict = (
  { state, actions }: Context,
  conflict: GitFileCompare
) => {
  state.git.conflicts.splice(state.git.conflicts.indexOf(conflict), 1);

  actions.git._tryResolveConflict();
};

export const deleteConflictedFile = async (
  { state, actions }: Context,
  conflict: GitFileCompare
) => {
  state.git.conflictsResolving.push(conflict.filename);
  const module = state.editor.modulesByPath['/' + conflict.filename];

  await actions.files.moduleDeleted({ moduleShortid: module.shortid });
  delete state.git.sourceModulesByPath['/' + conflict.filename];

  state.git.conflictsResolving.splice(
    state.git.conflictsResolving.indexOf(conflict.filename),
    1
  );
  state.git.conflicts.splice(state.git.conflicts.indexOf(conflict), 1);

  actions.git._tryResolveConflict();
};

export const diffConflictedFile = async (
  { state, actions }: Context,
  conflict: GitFileCompare
) => {
  const module = state.editor.modulesByPath['/' + conflict.filename] as Module;

  await actions.editor.moduleSelected({ id: module.id });

  actions.editor.setCode({
    moduleShortid: module.shortid,
    code: createDiff(module.code, conflict.content),
  });
};

export const resolveOutOfSync = async ({
  state,
  actions,
  effects,
}: Context) => {
  effects.analytics.track('GitHub - Resolve out of sync');
  const git = state.git;
  const { added, deleted, modified } = git.outOfSyncUpdates;

  git.isResolving = true;

  const sandbox = state.editor.currentSandbox!;

  // When we have a PR and the source is out of sync with base, we need to create a commit to update it. We do this
  // first, because we need the new source to deal with binary files
  if (git.gitState === SandboxGitState.OUT_OF_SYNC_PR_BASE) {
    const changes: GitChanges = {
      added: added.map(change => ({
        path: '/' + change.filename,
        content: change.content!,
        encoding: change.isBinary ? 'base64' : 'utf-8',
      })),
      deleted: deleted.map(change => '/' + change.filename),
      modified: modified.map(change => ({
        path: '/' + change.filename,
        content: change.content!,
        encoding: change.isBinary ? 'base64' : 'utf-8',
      })),
    };
    const commit = await effects.api.createGitCommit(
      sandbox.id,
      `Update from ${sandbox.baseGit!.branch}`,
      changes,
      [git.sourceCommitSha!]
    );
    sandbox.originalGit!.commitSha = commit.sha;
    sandbox.originalGitCommitSha = commit.sha;

    // If working directly we just need to update the commitSha, as
    // we are already in sync now
  } else {
    await effects.api.saveGitOriginalCommitSha(
      sandbox.id,
      git.sourceCommitSha!
    );
    sandbox.originalGit!.commitSha = git.sourceCommitSha;
    sandbox.originalGitCommitSha = git.sourceCommitSha;
  }

  await actions.git._loadSourceSandbox();

  if (added.length) {
    await actions.files.createModulesByPath({
      files: added.reduce((aggr, change) => {
        aggr[change.filename] = change.isBinary
          ? {
              content: git.sourceModulesByPath['/' + change.filename].code,
              isBinary: true,
              uploadId: git.sourceModulesByPath['/' + change.filename].uploadId,
              sha: git.sourceModulesByPath['/' + change.filename].sha,
            }
          : { content: change.content };

        return aggr;
      }, {}),
    });
  }

  if (deleted.length) {
    await Promise.all(
      deleted.map(change => {
        const module = state.editor.modulesByPath['/' + change.filename];

        return actions.files.moduleDeleted({ moduleShortid: module.shortid });
      })
    );
  }
  if (modified.length) {
    await Promise.all(
      modified.map(change => {
        const module = state.editor.modulesByPath['/' + change.filename];

        // If we are dealing with a private binary change, we need to bluntly update
        // the module
        if (git.sourceModulesByPath['/' + change.filename].sha) {
          const code = git.sourceModulesByPath['/' + change.filename].code;
          const uploadId = git.sourceModulesByPath['/' + change.filename]
            .uploadId!;
          const sha = git.sourceModulesByPath['/' + change.filename].sha!;

          const sandboxModule = sandbox.modules.find(
            moduleItem => moduleItem.shortid === module.shortid
          )!;
          sandboxModule.code = code;
          sandboxModule.uploadId = uploadId;
          sandboxModule.sha = sha;

          return effects.api
            .saveModulePrivateUpload(sandbox.id, module.shortid, {
              code,
              uploadId,
              sha,
            })
            .then(() => {});
        }
        actions.editor.setCode({
          moduleShortid: module.shortid,
          code: change.isBinary
            ? git.sourceModulesByPath['/' + change.filename].code
            : change.content!,
        });
        return actions.editor.codeSaved({
          moduleShortid: module.shortid,
          code: change.isBinary
            ? git.sourceModulesByPath['/' + change.filename].code
            : change.content!,
          cbID: null,
        });
      })
    );
  }

  actions.git._setGitChanges();
  git.outOfSyncUpdates.added = [];
  git.outOfSyncUpdates.deleted = [];
  git.outOfSyncUpdates.modified = [];
  git.gitState = SandboxGitState.SYNCED;
  git.isResolving = false;
};

export const _setGitChanges = ({ state, effects }: Context) => {
  const changes: {
    added: string[];
    deleted: string[];
    modified: string[];
  } = {
    added: [],
    deleted: [],
    modified: [],
  };

  state.editor.currentSandbox!.modules.forEach(module => {
    if (!(module.path in state.git.sourceModulesByPath)) {
      changes.added.push(module.path);
    } else if (
      (module.sha &&
        state.git.sourceModulesByPath[module.path].sha !== module.sha) ||
      (!module.sha &&
        state.git.sourceModulesByPath[module.path].code !== module.code)
    ) {
      changes.modified.push(module.path);
    }
  });

  const currentModule = state.editor.currentModule;

  effects.vscode.onFileDiff(
    currentModule,
    state.git.sourceModulesByPath[currentModule.path]!,
    state.editor.currentSandbox!.modules.find(
      e => e?.path === currentModule?.path
    )!
  );

  Object.keys(state.git.sourceModulesByPath).forEach(path => {
    if (!state.editor.modulesByPath[path]) {
      changes.deleted.push(path);
    }
  });
  state.git.gitChanges = changes;
};

export const _evaluateGitChanges = async (
  { state }: Context,
  changes: GitFileCompare[]
) => {
  const conflicts = changes.reduce<GitFileCompare[]>((aggr, change) => {
    const path = '/' + change.filename;

    // We are in conflict if a file has been removed in the source and the
    // sandbox has made changes to it
    if (
      change.status === 'removed' &&
      state.editor.modulesByPath[path] &&
      !(state.editor.modulesByPath[path] as Module).isBinary &&
      (state.editor.modulesByPath[path] as Module).code !== change.content
    ) {
      return aggr.concat(change);
    }

    // We are in conflict if a file has been modified in the source, but removed
    // from the sandbox
    if (change.status === 'modified' && !state.editor.modulesByPath[path]) {
      return aggr.concat(change);
    }

    // We are in conflict if the source changed the file and sandbox also changed the file
    if (
      change.status === 'modified' &&
      !(state.editor.modulesByPath[path] as Module).isBinary &&
      (state.editor.modulesByPath[path] as Module).code !== change.content &&
      (state.editor.modulesByPath[path] as Module).code !==
        state.git.sourceModulesByPath[path].code
    ) {
      return aggr.concat(change);
    }

    return aggr;
  }, []);
  const toUpdate: {
    added: GitFileCompare[];
    deleted: GitFileCompare[];
    modified: GitFileCompare[];
  } = { added: [], deleted: [], modified: [] };

  if (changes.length) {
    state.git.outOfSyncUpdates = changes.reduce((aggr, change) => {
      // If the change is a conflict, we do not set it up for a Sandbox update, we need
      // to handle the conflict explicitly
      if (conflicts.includes(change)) {
        return aggr;
      }

      // When not a conflict we check if the changes differs from the Sandbox. Any changes
      // will update the Sandbox
      if (
        (change.status === 'added' &&
          !state.editor.modulesByPath['/' + change.filename]) ||
        (change.status === 'removed' &&
          state.editor.modulesByPath['/' + change.filename]) ||
        (change.status === 'modified' &&
          (state.editor.modulesByPath['/' + change.filename] as Module).code !==
            change.content)
      ) {
        aggr[change.status === 'removed' ? 'deleted' : change.status].push(
          change
        );
      }

      return aggr;
    }, toUpdate);
  }

  return {
    changesCount:
      toUpdate.added.length +
      toUpdate.modified.length +
      toUpdate.deleted.length,
    conflicts,
  };
};

export const _loadSourceSandbox = async ({ state, effects }: Context) => {
  const sandbox = state.editor.currentSandbox!;
  const { originalGit } = sandbox;

  if (!originalGit) {
    return;
  }

  const sourceSandbox = await effects.api.getSandbox(
    `github/${originalGit.username}/${
      originalGit.repo
    }/tree/${sandbox.originalGitCommitSha!}/${originalGit.path}`
  );

  state.editor.sandboxes[sourceSandbox.id] = sourceSandbox;
  state.git.sourceSandboxId = sourceSandbox.id;

  state.git.sourceModulesByPath = sourceSandbox.modules.reduce(
    (aggr, module) => {
      const path = getModulePath(
        sourceSandbox.modules,
        sourceSandbox.directories,
        module.id
      );
      module.path = path;
      if (path) {
        aggr[path] = {
          code: module.code,
          isBinary: module.isBinary,
          uploadId: module.uploadId,
          sha: module.sha,
        };
      }

      return aggr;
    },
    {}
  );
};

export const _compareWithSource = async ({
  state,
  effects,
  actions,
}: Context) => {
  const sandbox = state.editor.currentSandbox!;
  const originalGitCommitSha = sandbox.originalGitCommitSha;

  try {
    const originalChanges = await effects.api.compareGit(
      sandbox.id,
      sandbox.originalGitCommitSha!,
      sandbox.originalGit!.branch,
      true
    );
    const updates = await actions.git._evaluateGitChanges(
      originalChanges.files
    );

    state.git.sourceCommitSha = originalChanges.headCommitSha;
    state.git.conflicts = updates.conflicts;

    if (updates.changesCount || updates.conflicts.length) {
      effects.notificationToast.add({
        message: `The sandbox is out of sync with "${
          sandbox.originalGit!.branch
        }" ${updates.conflicts.length ? 'and there are conflicts' : ''}`,
        title: 'Out of sync',
        status: convertTypeToStatus('notice'),
        sticky: false,
        actions: {
          primary: {
            label: 'Resolve',
            run: () => {
              actions.workspace.setWorkspaceItem({ item: 'github' });
            },
          },
          secondary: {
            label: 'See changes',
            run: () => {
              effects.browser.openWindow(
                `https://github.com/${sandbox.originalGit!.username}/${
                  sandbox.originalGit!.repo
                }/compare/${originalGitCommitSha}...${
                  sandbox.originalGit!.branch
                }`
              );
            },
          },
        },
      });
      effects.preview.refresh();
      state.git.gitState = updates.conflicts.length
        ? SandboxGitState.CONFLICT_SOURCE
        : SandboxGitState.OUT_OF_SYNC_SOURCE;
    } else {
      state.git.gitState = SandboxGitState.SYNCED;
    }
  } catch (e) {
    // if there is a base git the issue is that the new branch does not exist, if not carry on
    if (sandbox.baseGit) {
      state.currentModal = 'notFoundBranchModal';
    } else {
      throw new Error();
    }
  }
};

export const _compareWithBase = async ({
  state,
  effects,
  actions,
}: Context) => {
  const sandbox = state.editor.currentSandbox!;

  state.git.pr = await effects.api.getGitPr(sandbox.id, sandbox.prNumber!);
  state.git.sourceCommitSha = state.git.pr.commitSha;
  state.git.baseCommitSha = state.git.pr.baseCommitSha;

  const baseChanges = await effects.api.compareGit(
    sandbox.id,
    sandbox.originalGitCommitSha!,
    sandbox.baseGit!.branch,
    true
  );

  const updates = await actions.git._evaluateGitChanges(baseChanges.files);

  state.git.baseCommitSha = baseChanges?.headCommitSha;
  state.git.conflicts = updates.conflicts;

  if (updates.changesCount || updates.conflicts.length) {
    effects.notificationToast.add({
      message: `The sandbox is out of sync with "${sandbox.baseGit!.branch}" ${
        updates.conflicts.length ? 'and there are conflicts' : ''
      }`,
      title: 'Out of sync',
      status: convertTypeToStatus('notice'),
      sticky: false,
      actions: {
        primary: {
          label: 'Resolve',
          run: () => {
            actions.workspace.setWorkspaceItem({ item: 'github' });
          },
        },
        secondary: {
          label: 'See changes',
          run: () => {
            effects.browser.openWindow(
              `https://github.com/${sandbox.originalGit!.username}/${
                sandbox.originalGit!.repo
              }/compare/${sandbox.baseGit!.branch}...${
                sandbox.originalGit!.branch
              }`
            );
          },
        },
      },
    });
    effects.preview.refresh();
    state.git.gitState = updates.conflicts.length
      ? SandboxGitState.CONFLICT_PR_BASE
      : SandboxGitState.OUT_OF_SYNC_PR_BASE;
  } else {
    state.git.gitState = SandboxGitState.SYNCED;
  }
};

export const _getGitChanges = async ({ state, effects }: Context) => {
  const git = state.git;
  const sandbox = state.editor.currentSandbox!;

  return {
    added: await Promise.all(
      git.gitChanges.added
        .map(async path => {
          const module = sandbox.modules.find(
            moduleItem => moduleItem.path === path
          );

          if (!module) {
            logBreadcrumb({
              message: `Tried adding Git change, but paths don't match. Expected: ${path}, paths available: ${JSON.stringify(
                sandbox.modules.map(m => ({
                  shortid: m.shortid,
                  path: m.path,
                  isBinary: m.isBinary,
                }))
              )}`,
            });
            const err = new Error('Unable to add module to git changes');
            captureException(err);

            return false;
          }

          if (module!.isBinary) {
            return {
              path,
              content: await effects.http.blobToBase64(module!.code),
              encoding: 'base64' as 'base64',
            };
          }

          return {
            path,
            content: module!.code,
            encoding: 'utf-8' as 'utf-8',
          };
        })
        .filter(Boolean)
    ),
    deleted: git.gitChanges.deleted,
    modified: git.gitChanges.modified.map(path => {
      const module = sandbox.modules.find(
        moduleItem => moduleItem.path === path
      );

      // A binary can not be modified, because we have no mechanism for comparing
      // private binary files, as their urls are based on moduleId (which is different across sandboxes)
      return {
        path,
        content: module!.code,
        encoding: 'utf-8',
      };
    }),
  } as GitChanges;
};

export const _tryResolveConflict = async ({
  state,
  effects,
  actions,
}: Context) => {
  const git = state.git;
  actions.git._setGitChanges();

  if (git.conflicts.length === 0) {
    git.gitState =
      git.gitState === SandboxGitState.CONFLICT_PR_BASE
        ? SandboxGitState.RESOLVED_PR_BASE
        : SandboxGitState.RESOLVED_SOURCE;
  }

  // When the conflict is from a PR base and we just override it, we still have to create a commit to update the PR
  if (
    git.gitState === SandboxGitState.RESOLVED_PR_BASE &&
    !git.gitChanges.added.length &&
    !git.gitChanges.deleted.length &&
    !git.gitChanges.modified.length
  ) {
    state.git.isCommitting = true;
    const sandbox = state.editor.currentSandbox!;
    const changes = await actions.git._getGitChanges();
    state.git.title = 'Resolve conflict';
    const commit = await effects.api.createGitCommit(
      sandbox.id,
      'Resolved conflict',
      changes,
      git.baseCommitSha
        ? [git.sourceCommitSha!, git.baseCommitSha]
        : [git.sourceCommitSha!]
    );
    sandbox.originalGit!.commitSha = commit.sha;
    sandbox.originalGitCommitSha = commit.sha;
    git.isCommitting = false;
    git.title = '';
    git.description = '';
    git.gitState = SandboxGitState.SYNCED;
  }
};

export const linkToGitSandbox = async (
  { state, effects, actions }: Context,
  sandboxId: string
) => {
  if (!state.editor.currentSandbox) return;
  try {
    state.git.isLinkingToGitSandbox = true;
    const newGitData = await effects.api.makeGitSandbox(sandboxId);
    state.editor.currentSandbox = {
      ...state.editor.currentSandbox,
      originalGitCommitSha: newGitData.originalGitCommitSha,
      originalGit: newGitData.originalGit,
    };
    await actions.git.loadGitSource();
  } catch (error) {
    actions.internal.handleError({
      error,
      message:
        'There has been a problem connecting your sandbox to the GitHub repo. Please try again.',
    });
  } finally {
    state.git.isLinkingToGitSandbox = false;
  }
};
