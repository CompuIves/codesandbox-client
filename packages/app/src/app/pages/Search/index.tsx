import {
  ALGOLIA_API_KEY,
  ALGOLIA_APPLICATION_ID,
  ALGOLIA_DEFAULT_INDEX,
} from '@codesandbox/common/lib/utils/config';
import MaxWidth from '@codesandbox/common/lib/components/flex/MaxWidth';
import Margin from '@codesandbox/common/lib/components/spacing/Margin';
import { RouteComponentProps } from 'react-router-dom';
import qs from 'qs';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Helmet } from 'react-helmet';
import {
  Configure,
  InstantSearch,
  PoweredBy,
  SearchBox,
} from 'react-instantsearch-dom';

import { useActions } from 'app/overmind';
import { Navigation } from 'app/pages/common/Navigation';

import 'instantsearch.css/themes/reset.css';

import { Container, Content, Main, Title } from './elements';
import Filters from './Filters';
import Results from './Results';
import Styles from './search';

const updateAfter = 700;

const createURL = state => `?${qs.stringify(state)}`;

const searchStateToUrl = (location, searchState) =>
  searchState ? `${location.pathname}${createURL(searchState)}` : '';

type Props = RouteComponentProps;
export const Search: FunctionComponent<Props> = ({ history, location }) => {
  const { searchMounted } = useActions();
  const [searchState, setSearchState] = useState(
    qs.parse(location.search.slice(1))
  );
  const debouncedSetState = useRef(null);

  useEffect(() => {
    searchMounted();
  }, [searchMounted]);

  useEffect(() => {
    const unlisten = history.listen((loc, action) => {
      if (['POP', 'PUSH'].includes(action)) {
        setSearchState(qs.parse(loc.search.slice(1)));
      }

      return unlisten;
    });
  }, [history]);

  const onSearchStateChange = useCallback(
    newSearchState => {
      clearTimeout(debouncedSetState.current);

      debouncedSetState.current = setTimeout(() => {
        history.push(
          searchStateToUrl(location, newSearchState),
          newSearchState
        );
      }, updateAfter);

      setSearchState(newSearchState);
    },
    [history, location]
  );

  return (
    <Container>
      <Helmet>
        <title>Search - CodeSandbox</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Styles />
      <Navigation title="Search" />
      <MaxWidth>
        <Margin vertical={1.5}>
          <Content>
            <InstantSearch
              apiKey={ALGOLIA_API_KEY}
              appId={ALGOLIA_APPLICATION_ID}
              createURL={createURL}
              indexName={ALGOLIA_DEFAULT_INDEX}
              onSearchStateChange={onSearchStateChange}
              searchState={searchState}
            >
              <Configure hitsPerPage={12} />

              <Main alignItems="flex-start">
                <div>
                  <Title>Search</Title>

                  <PoweredBy />

                  <SearchBox
                    autoFocus
                    translations={{ placeholder: 'Search Sandboxes...' }}
                  />

                  <Results />
                </div>

                <Filters />
              </Main>
            </InstantSearch>
          </Content>
        </Margin>
      </MaxWidth>
    </Container>
  );
};
