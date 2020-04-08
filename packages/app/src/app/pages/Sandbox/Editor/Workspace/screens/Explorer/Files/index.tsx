import { getModulePath } from '@codesandbox/common/lib/sandbox/modules';
import { Collapsible, SidebarRow } from '@codesandbox/components';
import css from '@styled-system/css';
import React, { FunctionComponent, useCallback, useState } from 'react';

import { useOvermind } from 'app/overmind';

import EditIcons from './DirectoryEntry/Entry/EditIcons';
import DirectoryEntry from './DirectoryEntry/index';

export const Files: FunctionComponent = () => {
  const {
    actions: { editor, files },
    state: {
      editor: editorState,
      editor: {
        currentSandbox: { directories, modules, privacy, title },
      },
      isLoggedIn,
    },
  } = useOvermind();
  const [editActions, setEditActions] = useState(null);

  const _getModulePath = useCallback(
    moduleId => {
      try {
        return getModulePath(modules, directories, moduleId);
      } catch {
        return '';
      }
    },
    [directories, modules]
  );

  return (
    <Collapsible css={{ position: 'relative' }} defaultOpen title="Files">
      <SidebarRow
        css={css({
          // these could have been inside the collapsible as "actions"
          // but this is the only exception where we have actions in the
          // collapsible header. Keeping them in the body, also lets us
          // get the animation effect of open/close state on it's own
          // If this UI pattern catches on, it would be a good refactor
          // to add actions API to collapsible
          position: 'absolute',
          top: 0,
          right: 2,
        })}
        justify="flex-end"
      >
        {editActions}
      </SidebarRow>

      <DirectoryEntry
        depth={-1}
        getModulePath={_getModulePath}
        id={null}
        initializeProperties={({
          onCreateDirectoryClick,
          onUploadFileClick,
          onCreateModuleClick,
        }) => {
          if (!setEditActions) {
            return;
          }

          setEditActions(
            // @ts-ignore
            <EditIcons
              forceShow={window.__isTouch}
              hovering
              onCreateDirectory={onCreateDirectoryClick}
              onCreateFile={onCreateModuleClick}
              onDownload={editor.createZipClicked}
              onUploadFile={
                isLoggedIn && privacy === 0 ? onUploadFileClick : undefined
              }
            />
          );
        }}
        root
        shortid={null}
        signals={{ files, editor }}
        store={{ editor: editorState, isLoggedIn }}
        title={title || 'Project'}
      />
    </Collapsible>
  );
};
