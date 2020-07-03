import React from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useHistory } from 'react-router-dom';
import { useOvermind } from 'app/overmind';
import { Header } from 'app/pages/NewDashboard/Components/Header';
import { SelectionProvider } from 'app/pages/NewDashboard/Components/Selection';
import { VariableGrid } from 'app/pages/NewDashboard/Components/VariableGrid';
import { DashboardGridItem, PageTypes } from 'app/pages/NewDashboard/types';
import { dashboard } from '@codesandbox/common/lib/utils/url-generator';
import { getPossibleTemplates } from '../../utils';
import { useFilteredItems } from './useFilteredItems';

export const AllPage = () => {
  const [level, setLevel] = React.useState(0);
  const [creating, setCreating] = React.useState(false);
  const params = useParams<{ path: string }>();
  const history = useHistory();
  const currentPath = decodeURIComponent(params.path || '');
  const cleanParam = currentPath.split(' ').join('{}');
  const items = useFilteredItems(currentPath, cleanParam, level);
  const {
    actions,
    state: {
      dashboard: { allCollections, sandboxes },
      activeTeam,
    },
  } = useOvermind();
  const [localTeam, setLocalTeam] = React.useState(activeTeam);

  React.useEffect(() => {
    actions.dashboard.getAllFolders();
  }, [actions.dashboard, activeTeam]);

  React.useEffect(() => {
    if (localTeam !== activeTeam) {
      setLocalTeam(activeTeam);

      if (params) {
        history.push(dashboard.allSandboxes('/', activeTeam));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam]);

  React.useEffect(() => {
    if (!currentPath || currentPath === '/') {
      setLevel(0);
    } else {
      setLevel(currentPath.split('/').length);
    }
    actions.dashboard.getSandboxesByPath(currentPath);
  }, [currentPath, actions.dashboard, activeTeam]);

  const activeSandboxes = sandboxes.ALL && sandboxes.ALL[cleanParam];
  const itemsToShow: DashboardGridItem[] = allCollections
    ? [
        creating && {
          type: 'new-folder' as 'new-folder',
          basePath: currentPath,
          setCreating,
        },
        ...items,
      ].filter(Boolean)
    : [{ type: 'skeleton-row' }, { type: 'skeleton-row' }];

  const currentCollection = allCollections?.find(
    c => c.path === '/' + currentPath
  );

  const pageType: PageTypes = 'sandboxes';

  return (
    <SelectionProvider
      items={itemsToShow}
      page={pageType}
      activeTeamId={activeTeam}
      createNewFolder={() => setCreating(true)}
      createNewSandbox={
        currentCollection
          ? () => {
              actions.modals.newSandboxModal.open({
                collectionId: currentCollection.id,
              });
            }
          : null
      }
    >
      <Helmet>
        <title>
          {currentPath.split('/').pop() || 'Dashboard'} - CodeSandbox
        </title>
      </Helmet>
      <Header
        activeTeam={activeTeam}
        path={currentPath}
        templates={getPossibleTemplates(activeSandboxes || [])}
        createNewFolder={() => setCreating(true)}
        showViewOptions
        showFilters={Boolean(currentPath)}
        showSortOptions={Boolean(currentPath)}
      />
      <VariableGrid
        page={pageType}
        collectionId={currentCollection?.id}
        items={itemsToShow}
      />
    </SelectionProvider>
  );
};

export const All = React.memo(AllPage);
