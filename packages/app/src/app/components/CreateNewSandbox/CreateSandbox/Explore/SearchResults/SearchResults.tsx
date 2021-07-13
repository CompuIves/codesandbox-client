import React from 'react';
import {
  ALGOLIA_API_KEY,
  ALGOLIA_APPLICATION_ID,
  ALGOLIA_DEFAULT_INDEX, // eslint-disable-line
} from '@codesandbox/common/lib/utils/config';
import {
  connectStateResults,
  InstantSearch,
  Configure,
  Stats,
} from 'react-instantsearch-dom';
import { SubHeader } from '../../elements';
import { GlobalSearchStyles } from './elements';
import { ExploreResultList } from './ExploreResultList';
import { Loader } from '../../Loader';

const LoadingIndicator = connectStateResults(({ isSearchStalled }) =>
  isSearchStalled ? <Loader /> : null
);

export const SearchResults = ({ search }: { search: string }) => (
  <>
    <GlobalSearchStyles />
    <InstantSearch
      appId={ALGOLIA_APPLICATION_ID}
      apiKey={ALGOLIA_API_KEY}
      indexName={ALGOLIA_DEFAULT_INDEX}
    >
      <Configure
        query={search}
        hitsPerPage={50}
        facetFilters={[
          [
            'custom_template.published: true',
            'custom_template.published: false',
          ],
        ]}
      />

      <SubHeader>
        <Stats
          translations={{
            stats: nbHits => `${nbHits.toLocaleString()} results found`,
          }}
        />
      </SubHeader>
      <LoadingIndicator />
      <ExploreResultList />
    </InstantSearch>
  </>
);
