import { useOvermind } from 'app/overmind';
import { sandboxesTypes } from 'app/overmind/namespaces/dashboard/state';
import { Header } from 'app/pages/NewDashboard/Components/Header';
import {
  VariableGrid,
  SkeletonGrid,
} from 'app/pages/NewDashboard/Components/VariableGrid';
import { SelectionProvider } from 'app/pages/NewDashboard/Components/Selection';
import React, { useEffect } from 'react';
import { withRouter } from 'react-router-dom';

export const SearchComponent = ({ location }) => {
  const {
    actions,
    state: {
      dashboard: { sandboxes, orderBy, filters },
    },
  } = useOvermind();

  useEffect(() => {
    actions.dashboard.getPage(sandboxesTypes.SEARCH);
  }, [actions.dashboard, location.search, filters, orderBy]);

  return (
    <SelectionProvider sandoxes={sandboxes.SEARCH}>
      <Header
        title="Search results"
        showViewOptions
        showFilters
        showSortOptions
      />
      <section style={{ position: 'relative' }}>
        {sandboxes.SEARCH ? (
          <VariableGrid
            items={
              sandboxes.SEARCH &&
              sandboxes.SEARCH.map(sandbox => ({
                type: 'sandbox',
                ...sandbox,
              }))
            }
          />
        ) : (
          <SkeletonGrid count={4} />
        )}
      </section>
    </SelectionProvider>
  );
};

export const Search = withRouter(SearchComponent);
