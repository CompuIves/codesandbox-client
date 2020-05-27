import React from 'react';
import { useOvermind } from 'app/overmind';
import { useHistory } from 'react-router-dom';
import {
  SandboxFragmentDashboardFragment as Sandbox,
  TemplateFragmentDashboardFragment as Template,
} from 'app/graphql/types';
import { sandboxUrl } from '@codesandbox/common/lib/utils/url-generator';
import { Stack, Element, Menu } from '@codesandbox/components';
import css from '@styled-system/css';

export const ContextMenu = ({
  visible,
  position,
  setVisibility,
  selectedIds,
  sandboxes,
  folders,
}) => {
  React.useEffect(() => {
    const handler = () => {
      if (visible) setVisibility(false);
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [visible, setVisibility]);

  if (!visible || selectedIds.length === 0) return null;

  const selectedItems = selectedIds.map(id => {
    if (id.startsWith('/')) {
      const folder = folders.find(f => f.path === id);
      return { type: 'folder', ...folder };
    }
    const sandbox = sandboxes.find(s => s.id === id);
    return { type: 'sandbox', ...sandbox };
  });

  let menu;
  if (selectedItems.length > 1) {
    menu = <MultiMenu selectedItems={selectedItems} />;
  } else if (selectedItems[0].type === 'sandbox') {
    menu = <SandboxMenu sandbox={selectedItems[0]} />;
  } else if (selectedItems[0].type === 'folder') {
    menu = <FolderMenu folder={selectedItems[0]} />;
  }

  return (
    <>
      <Stack
        data-reach-menu-list
        data-component="MenuList"
        css={css({
          position: 'absolute',
          top: position.y,
          left: position.x,
        })}
      >
        {menu}
      </Stack>
    </>
  );
};

const MenuItem = props => (
  <Element data-reach-menu-item="" data-component="MenuItem" {...props} />
);

type SandboxItemType = Sandbox & {
  isTemplate?: boolean;
  template?: Pick<Template, 'id' | 'color' | 'iconUrl' | 'published'>;
};

const SandboxMenu = ({ sandbox }: { sandbox: SandboxItemType }) => {
  const { effects, actions } = useOvermind();
  const history = useHistory();

  const url = sandboxUrl({
    id: sandbox.id,
    alias: sandbox.alias,
  });

  const getFolderUrl = () => {
    if (sandbox.isTemplate) return '/new-dashboard/templates';

    const path = sandbox.collection.path;
    if (path === '/' || !path) return '/new-dashboard/all/drafts';

    return '/new-dashboard/all' + path;
  };

  return (
    <>
      <MenuItem onClick={() => history.push(url)}>Open sandbox</MenuItem>
      <MenuItem
        onClick={() => {
          window.open(`https://codesandbox.io${url}`, '_blank');
        }}
      >
        Open sandbox in new tab
      </MenuItem>
      <MenuItem
        onClick={() => {
          history.push(getFolderUrl());
        }}
      >
        Show in Folder
      </MenuItem>
      <Menu.Divider />
      <MenuItem
        onClick={() => {
          effects.browser.copyToClipboard(`https://codesandbox.io${url}`);
        }}
      >
        Copy sandbox link
      </MenuItem>
      <MenuItem
        onClick={() => {
          actions.editor.forkExternalSandbox({
            sandboxId: sandbox.id,
            openInNewWindow: true,
          });
        }}
      >
        Fork sandbox
      </MenuItem>
      <MenuItem
        onClick={() => {
          actions.dashboard.downloadSandboxes([sandbox.id]);
        }}
      >
        Export {sandbox.isTemplate ? 'template' : 'sandbox'}
      </MenuItem>
      <Menu.Divider />
      <MenuItem onClick={() => {}}>Rename sandbox</MenuItem>
      {sandbox.isTemplate ? (
        <MenuItem
          onClick={() => {
            actions.dashboard.unmakeTemplate([sandbox.id]);
          }}
        >
          Convert to Sandbox
        </MenuItem>
      ) : (
        <MenuItem
          onClick={() => {
            actions.dashboard.makeTemplate([sandbox.id]);
          }}
        >
          Make sandbox a template
        </MenuItem>
      )}
      <Menu.Divider />
      {sandbox.isTemplate ? (
        <MenuItem
          onClick={() =>
            actions.dashboard.deleteTemplate({
              sandboxId: sandbox.id,
              templateId: sandbox.template.id,
            })
          }
        >
          Delete template
        </MenuItem>
      ) : (
        <MenuItem
          onClick={() => {
            actions.dashboard.deleteSandbox([sandbox.id]);
          }}
        >
          Delete sandbox
        </MenuItem>
      )}
    </>
  );
};

const FolderMenu = ({ folder }) => {
  const { actions } = useOvermind();
  return (
    <>
      <MenuItem onClick={() => {}}>Rename folder</MenuItem>
      <MenuItem
        onClick={() => actions.dashboard.deleteFolder({ path: folder.path })}
      >
        Delete folder
      </MenuItem>
    </>
  );
};

const MultiMenu = ({ selectedItems }) => {
  const { actions } = useOvermind();
  /*
    sandbox options - export, make template, delete
    template options - export, unmake template, delete
    folder options - delete

    sandboxes + templates - export, delete
    sandboxes + folders - delete
  */

  const folders = selectedItems.filter(item => item.type === 'folder');
  const templates = selectedItems.filter(item => item.isTemplate);
  const sandboxes = selectedItems.filter(
    item => item.type === 'sandbox' && !item.isTemplate
  );

  const exportItems = () => {
    const ids = [
      ...sandboxes.map(sandbox => sandbox.id),
      ...templates.map(template => template.id),
    ];
    actions.dashboard.downloadSandboxes(ids);
  };

  const convertToTemplates = () => {
    actions.dashboard.makeTemplate(sandboxes.map(sandbox => sandbox.id));
  };

  const convertToSandboxes = () => {
    actions.dashboard.unmakeTemplate(templates.map(template => template.id));
  };

  const deleteItems = () => {
    folders.forEach(folder =>
      actions.dashboard.deleteFolder({ path: folder.path })
    );

    templates.forEach(sandbox =>
      actions.dashboard.deleteTemplate({
        sandboxId: sandbox.id,
        templateId: sandbox.template.id,
      })
    );

    if (sandboxes.length) {
      actions.dashboard.deleteSandbox(sandboxes.map(sandbox => sandbox.id));
    }
  };

  const EXPORT = { label: 'Export items', fn: exportItems };
  const DELETE = { label: 'Delete items', fn: deleteItems };
  const CONVERT_TO_TEMPLATE = {
    label: 'Convert to templates',
    fn: convertToTemplates,
  };
  const CONVERT_TO_SANDBOX = {
    label: 'Convert to sandboxes',
    fn: convertToSandboxes,
  };

  let options = [];

  if (folders.length) {
    options = [DELETE];
  } else if (sandboxes.length && templates.length) {
    options = [EXPORT, DELETE];
  } else if (templates.length) {
    options = [EXPORT, CONVERT_TO_SANDBOX, DELETE];
  } else if (sandboxes.length) {
    options = [EXPORT, CONVERT_TO_TEMPLATE, DELETE];
  }

  return (
    <>
      {options.map(option => (
        <MenuItem key={option.label} onClick={option.fn}>
          {option.label}
        </MenuItem>
      ))}
    </>
  );
};
