// @flow

import * as React from 'react';
import { sortBy } from 'lodash-es';

import type {
  Module,
  Directory as DirectoryType,
} from '@codesandbox/common/lib/types';

import { isMainModule } from '@codesandbox/common/lib/sandbox/modules';
// eslint-disable-next-line import/extensions
import getType from 'app/utils/get-type.ts';

import File from '../File';

import { Container } from './elements';

type Props = {
  modules: Array<Module>,
  directories: Array<DirectoryType>,
  directoryId: ?string,
  depth?: number,
  currentModule: string,
  setCurrentModule: (id: string) => void,
  template: string,
  entry: string,
};

function Files({
  modules,
  directories,
  directoryId,
  depth = 0,
  currentModule,
  setCurrentModule,
  template,
  entry,
}: Props) {
  const childrenModules = modules.filter(
    m => m.directoryShortid === directoryId
  );

  const childrenDirectories = directories.filter(
    d => d.directoryShortid === directoryId
  );

  return (
    <Container>
      {sortBy(childrenDirectories, directory => directory.title).map(
        directory => (
          <Directory
            key={directory.shortid}
            directory={directory}
            currentModuleId={currentModule}
            setCurrentModule={setCurrentModule}
            template={template}
            entry={entry}
            modules={modules}
            directories={directories}
            depth={depth}
          />
        )
      )}
      {sortBy(childrenModules, m => m.title).map(m => (
        <File
          id={m.id}
          shortid={m.shortid}
          title={m.title}
          key={m.shortid}
          type={getType(m.title)}
          depth={depth}
          setCurrentModule={setCurrentModule}
          active={m.id === currentModule}
          alternative={isMainModule(m, modules, directories, entry)}
        />
      ))}
    </Container>
  );
}

function Directory({
  directory,
  currentModuleId,
  setCurrentModule,
  template,
  entry,
  modules,
  directories,
  depth,
}) {
  /** directory should be open by default if currentModule is inside it */

  // TODO:
  // 1. Create the current module tree
  // 2. Check if directory is in that array

  const getParentDirectory = (directories, child) => {
    return directories.find(directory => {
      return directory.shortid === child.directoryShortid;
    });
  };

  const getCurrentModuleTree = (modules, currentModuleId) => {
    const currentModule = modules.find(module => module.id === currentModuleId);

    const currentModuleTree = [currentModule];

    let parentDirectory = getParentDirectory(directories, currentModule);

    while (parentDirectory) {
      currentModuleTree.push(parentDirectory);
      // get parent directory of the parent directory
      parentDirectory = getParentDirectory(directories, parentDirectory);
    }

    return currentModuleTree;
  };

  const currentModuleTree = getCurrentModuleTree(modules, currentModuleId);

  let openByDefault = false;
  if (currentModuleTree.find(module => module.id === directory.id)) {
    openByDefault = true;
  }

  const [open, setOpen] = React.useState(openByDefault);

  return (
    <div>
      <File
        id={directory.id}
        shortid={directory.shortid}
        title={directory.title}
        type={open ? 'directory-open' : 'directory'}
        depth={depth}
        setCurrentModule={setCurrentModule}
        onClick={_ => setOpen(!open)}
      />
      {open ? (
        <Files
          modules={modules}
          directories={directories}
          directoryId={directory.shortid}
          depth={depth + 1}
          setCurrentModule={setCurrentModule}
          currentModule={currentModuleId}
          template={template}
          entry={entry}
        />
      ) : null}
    </div>
  );
}

export default Files;
