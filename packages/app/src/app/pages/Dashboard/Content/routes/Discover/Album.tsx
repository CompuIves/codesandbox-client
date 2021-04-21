import React from 'react';
import css from '@styled-system/css';
import { Helmet } from 'react-helmet';
import { useAppState, useActions } from 'app/overmind';
import { Grid, Column, Element } from '@codesandbox/components';
import { SelectionProvider } from 'app/pages/Dashboard/Components/Selection';
import { CommunitySandbox } from 'app/pages/Dashboard/Components/CommunitySandbox';
import { Header } from 'app/pages/Dashboard/Components/Header';
import { sandboxesTypes } from 'app/overmind/namespaces/dashboard/types';
import {
  GRID_MAX_WIDTH,
  GUTTER,
} from 'app/pages/Dashboard/Components/VariableGrid';
import { DashboardCommunitySandbox } from 'app/pages/Dashboard/types';

export const Album = ({ match }) => {
  const {
    activeTeam,
    dashboard: { sandboxes, curatedAlbums },
  } = useAppState();

  const {
    dashboard: { getPage },
  } = useActions();

  React.useEffect(() => {
    if (curatedAlbums.length === 0) getPage(sandboxesTypes.DISCOVER);
    if (!sandboxes.LIKED) getPage(sandboxesTypes.LIKED);
  }, [getPage, curatedAlbums, sandboxes.LIKED]);

  const albumId = match.params.id;
  const album = curatedAlbums.find(a => a.id === albumId);
  const likedSandboxIds = (sandboxes.LIKED || []).map(s => s.id);

  if (!album) return null;

  const selectionItems: DashboardCommunitySandbox[] = album.sandboxes.map(
    sandbox => ({
      type: 'community-sandbox',
      noDrag: true,
      autoFork: false,
      sandbox: { ...sandbox, liked: false },
    })
  );

  return (
    <Element
      css={css({
        width: '100%',
        paddingY: 10,
        '#selection-container': { overflowY: 'auto' },
      })}
    >
      <Helmet>
        <title>Discover - CodeSandbox</title>
      </Helmet>
      <Header
        activeTeam={activeTeam}
        path={album.title as string}
        albumId={album.id}
      />

      <SelectionProvider
        activeTeamId={activeTeam}
        page="discover"
        items={selectionItems}
      >
        <Element
          css={css({
            marginX: 'auto',
            width: `calc(100% - ${2 * GUTTER}px)`,
            maxWidth: GRID_MAX_WIDTH - 2 * GUTTER,
          })}
        >
          <Grid
            id="variable-grid"
            rowGap={6}
            columnGap={6}
            css={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            }}
          >
            {album.sandboxes.map(sandbox => (
              <Column key={sandbox.id}>
                <CommunitySandbox
                  isScrolling={false}
                  item={{
                    type: 'community-sandbox',
                    noDrag: true,
                    autoFork: false,
                    sandbox: {
                      ...sandbox,
                      liked: likedSandboxIds.includes(sandbox.id),
                    },
                  }}
                />
              </Column>
            ))}
            <div />
            <div />
          </Grid>
        </Element>
      </SelectionProvider>
    </Element>
  );
};

// export const Breadcrumbs: React.FC<BreadcrumbProps> = ({
//   path,
//   activeTeam,
//   repos,
// }) => (
//   <Text marginBottom={1} block weight="bold" size={5}>
//     <Link
//       to={
//         repos
//           ? dashboard.repos(activeTeam)
//           : dashboard.allSandboxes('/', activeTeam)
//       }
//       as={LinkBase}
//       variant={path && path.split('/').length ? 'muted' : 'body'}
//     >
//       {repos ? 'Repositories' : 'All Sandboxes'} {path && ' / '}
//     </Link>
//     {path
//       ? path.split('/').map((p, i) => {
//           const partPath = path
//             .split('/')
//             .slice(0, i + 1)
//             .join('/');

//           return (
//             <Link
//               key={p}
//               as={LinkBase}
//               to={
//                 repos
//                   ? dashboard.repos(activeTeam)
//                   : dashboard.allSandboxes('/' + partPath, activeTeam)
//               }
//               variant={i < path.split('/').length - 1 ? 'muted' : 'body'}
//             >
//               {p} {i < path.split('/').length - 1 && '/ '}
//             </Link>
//           );
//         })
//       : null}
//   </Text>
// );
