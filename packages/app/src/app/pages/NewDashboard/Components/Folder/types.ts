import React from 'react';

export interface FolderItemComponentProps {
  name: string;
  path: string;
  numberOfSandboxes: number;
  // interactions
  selected: boolean;
  onClick?: (evt: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (evt: React.MouseEvent<HTMLDivElement>) => void;
  onContextMenu?: (evt: React.MouseEvent) => void;
  // editing
  editing: boolean;
  isNewFolder: boolean;
  newName: string;
  onChange: (evt: React.FormEvent<HTMLInputElement>) => void;
  onInputKeyDown: (evt: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: (evt: React.FormEvent<HTMLFormElement>) => void;
  onInputBlur: (evt: React.FocusEvent<HTMLInputElement>) => void;
  // drop target
  showDropStyles?: boolean;
  // drag preview
  thumbnailRef?: React.Ref<HTMLDivElement>;
  opacity?: number;
}

type EditingProps = {};
