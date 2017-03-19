// @flow
import React from 'react';
import styled from 'styled-components';
import { DragSource } from 'react-dnd';

import FileIcon from 'react-icons/lib/fa/file';
import FolderIcon from 'react-icons/lib/fa/folder';
import EditIcon from 'react-icons/lib/go/pencil';
import DeleteIcon from 'react-icons/lib/go/trashcan';

import theme from '../../../../../../../../../common/theme';

import EntryContainer from '../../../EntryContainer';
import EntryTitle from './EntryTitle';
import EntryTitleInput from './EntryTitleInput';
import EntryIcons from './EntryIcons';
import EditIcons from './EditIcons';

type Props = {
  id: string,
  title: string,
  depth: number,
  active: boolean,
  isNotSynced: boolean,
  type: string,
  onCreateModuleClick: ?() => void,
  onCreateDirectoryClick: ?() => void,
  renameValidator: (id: string, title: string) => boolean,
  rename: (id: string, title: string) => boolean,
  deleteEntry: (id: string) => void,
  onRenameCancel: () => void,
  state: ?'' | 'editing' | 'creating',
  isOpen: ?boolean,
  onClick: Function,
  openMenu: Function,
  hasChildren: ?boolean,
  setCurrentModule: (id: string) => void,
  root: ?boolean,
  isMainModule: boolean,
};

type State = {
  state: '' | 'editing' | 'creating',
  error: boolean,
  selected: boolean,
  hovering: boolean,
};

const EditIconsContainer = styled(EditIcons)`
  position: absolute;
  right: 1rem;
`;

class Entry extends React.PureComponent {
  constructor(props: Props) {
    super(props);
    this.state = {
      state: props.state || '',
      error: false,
      selected: false,
      hovering: false,
    };
  }

  resetState = () => {
    if (this.props.onRenameCancel) {
      this.props.onRenameCancel();
    }
    this.setState({ state: '', error: false });
  };

  handleValidateTitle = (title: string) => {
    const isInvalidTitle = this.props.renameValidator(this.props.id, title);
    this.setState({ error: isInvalidTitle });
  };

  handleRename = (title: string, force: ?boolean) => {
    const { id } = this.props;
    const canRename = !this.handleValidateTitle(title);
    if (canRename) {
      this.props.rename(id, title);
      this.resetState();
    } else if (force) this.resetState();
  };

  delete = () => {
    const { id, deleteEntry } = this.props;
    return deleteEntry(id);
  };

  rename = () => {
    this.setState({ state: 'editing' });
    return true; // To close it
  };

  openContextMenu = (event: MouseEvent) => {
    const {
      id,
      isMainModule,
      onCreateModuleClick,
      onCreateDirectoryClick,
      rename,
      deleteEntry,
    } = this.props;

    if (isMainModule) {
      return;
    }

    event.preventDefault();
    this.setState({
      selected: true,
    });

    const items = [
      onCreateModuleClick && {
        title: 'New Module',
        action: onCreateModuleClick,
        icon: FileIcon,
      },
      onCreateDirectoryClick && {
        title: 'New Directory',
        action: onCreateDirectoryClick,
        icon: FolderIcon,
      },
      rename && {
        title: 'Rename',
        action: this.rename,
        icon: EditIcon,
      },
      deleteEntry && {
        title: 'Delete',
        action: this.delete,
        color: theme.red.darken(0.2)(),
        icon: DeleteIcon,
      },
    ].filter(x => x);
    this.props.openMenu(items, event.clientX, event.clientY, () => {
      this.setState({ selected: false });
    });
  };

  setCurrentModule = () => this.props.setCurrentModule(this.props.id);

  onMouseEnter = () => this.setState({ hovering: true });
  onMouseLeave = () => this.setState({ hovering: false });

  props: Props;
  state: State;

  render() {
    const {
      title,
      depth,
      isOpen,
      hasChildren,
      type,
      active,
      setCurrentModule,
      connectDragSource,
      onCreateModuleClick,
      onCreateDirectoryClick,
      deleteEntry,
      onClick,
      rename,
      isNotSynced,
      root,
    } = this.props;
    const { state, error, selected, hovering } = this.state;

    return connectDragSource(
      <div>
        <EntryContainer
          onClick={setCurrentModule ? this.setCurrentModule : onClick}
          depth={depth}
          nameValidationError={error}
          active={active}
          editing={state === 'editing' || selected}
          onContextMenu={this.openContextMenu}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
        >
          <EntryIcons
            isNotSynced={isNotSynced}
            hasChildren={hasChildren}
            isOpen={isOpen}
            type={type}
            root={root}
          />
          {state === 'editing'
            ? <EntryTitleInput
                title={title}
                onChange={this.handleValidateTitle}
                onCancel={this.resetState}
                onCommit={this.handleRename}
              />
            : <EntryTitle title={title} />}
          {state === '' &&
            <EditIconsContainer
              hovering={hovering}
              onCreateFile={onCreateModuleClick}
              onCreateDirectory={onCreateDirectoryClick}
              onDelete={deleteEntry && this.delete}
              onEdit={rename && this.rename}
            />}
        </EntryContainer>
      </div>
    );
  }
}

const entrySource = {
  canDrag: props => !!props.id && !props.isMainModule,
  beginDrag: props => {
    if (props.closeTree) props.closeTree();
    return { id: props.id, directory: props.type === 'directory' };
  },
};

const collectSource = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
});

export default DragSource('ENTRY', entrySource, collectSource)(Entry);
