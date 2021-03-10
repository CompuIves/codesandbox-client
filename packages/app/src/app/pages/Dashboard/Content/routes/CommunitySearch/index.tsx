import React from 'react';
import { useOvermind } from 'app/overmind';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { InstantSearch, SearchBox, Configure } from 'react-instantsearch/dom';
import { connectHits, connectRefinementList } from 'react-instantsearch-dom';
import VisuallyHidden from '@reach/visually-hidden';

import getTemplateDefinition, {
  TemplateType,
} from '@codesandbox/common/lib/templates';
import { Header } from 'app/pages/Dashboard/Components/Header';
import { SelectionProvider } from 'app/pages/Dashboard/Components/Selection';
import { VariableGrid } from 'app/pages/Dashboard/Components/VariableGrid';
import {
  DashboardCommunitySandbox,
  PageTypes,
} from 'app/pages/Dashboard/types';
import {
  ALGOLIA_API_KEY,
  ALGOLIA_APPLICATION_ID,
  ALGOLIA_DEFAULT_INDEX,
} from '@codesandbox/common/lib/utils/config';
import {
  Element,
  List,
  ListAction,
  Checkbox,
  Input,
  Stack,
  Text,
} from '@codesandbox/components';
import css from '@styled-system/css';
import { formatNumber } from '@codesandbox/components/lib/components/Stats';

export const CommunitySearch = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('query');
  const [refinementList, setRefinementList] = React.useState({
    template: [],
    'npm_dependencies.dependency': [],
  });

  return (
    <Element
      as="section"
      css={{
        position: 'relative',
        height: '100%',
        width: '100%',
        '> div': { height: '100%' },
      }}
    >
      <InstantSearch
        apiKey={ALGOLIA_API_KEY}
        appId={ALGOLIA_APPLICATION_ID}
        indexName={ALGOLIA_DEFAULT_INDEX}
        searchState={{ query, refinementList }}
      >
        <Configure hitsPerPage={100} />
        <VisuallyHidden>
          <SearchBox />
        </VisuallyHidden>
        <Results
          refinementList={refinementList}
          setRefinementList={setRefinementList}
        />
      </InstantSearch>
    </Element>
  );
};

const Results = connectHits(({ hits, refinementList, setRefinementList }) => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('query');
  const pageType: PageTypes = 'search';

  const {
    state: { activeTeam },
  } = useOvermind();

  const items: DashboardCommunitySandbox[] = hits.map(sandbox => ({
    noDrag: true,
    autoFork: false,
    type: 'community-sandbox',
    sandbox: {
      id: sandbox.objectID,
      alias: sandbox.alias,
      title: sandbox.title,
      description: sandbox.description,
      screenshotUrl: `https://codesandbox.io/api/v1/sandboxes/${sandbox.objectID}/screenshot.png`,
      forkCount: Number(sandbox.fork_count),
      likeCount: Number(sandbox.like_count),
      source: { template: sandbox.template },
      author: {
        // @ts-ignore - Hit<BasicDoc> assumes every field
        // is a string even when it's an object
        username: sandbox.author?.username,
        // @ts-ignore
        avatarUrl: sandbox.author?.avatar_url,
      },
    },
  }));

  return (
    <SelectionProvider activeTeamId={activeTeam} page={pageType} items={items}>
      <Helmet>
        <title>
          {location.search
            ? `Search: '${query}' - CodeSandbox`
            : 'Search - CodeSandbox'}
        </title>
      </Helmet>
      <Stack>
        <Header
          title={`Search results for '${query}' in Community`}
          activeTeam={activeTeam}
          showViewOptions
          showFilters
          CustomFilters={
            <div style={{ width: 256 }}>
              <Filters
                attribute="template"
                limit={3}
                operator="or"
                refinementList={refinementList}
                setRefinementList={setRefinementList}
              />
              <Filters
                attribute="npm_dependencies.dependency"
                limit={3}
                operator="and"
                refinementList={refinementList}
                setRefinementList={setRefinementList}
              />
            </div>
          }
        />
      </Stack>
      <VariableGrid items={items} page={pageType} />;
    </SelectionProvider>
  );
});

const Filters = connectRefinementList(
  ({ attribute, items, searchForItems, refinementList, setRefinementList }) => {
    const prettyAttribute =
      attribute === 'template' ? 'Environment' : 'Dependencies';

    const inputRef = React.useRef(null);

    return (
      <Stack direction="vertical" gap={4} marginY={4}>
        <Stack direction="vertical" gap={4} marginX={3}>
          <Text size={3}>{prettyAttribute}</Text>
          <Input
            type="search"
            ref={inputRef}
            placeholder={`Search for ${prettyAttribute}`}
            onChange={event => searchForItems(event.currentTarget.value)}
          />
        </Stack>
        <List
          css={{
            // min height so that it doesn't jump shrink when there are <3 results
            minHeight: 96,
          }}
        >
          {items.map(item => {
            const templateName = item.label as TemplateType;
            const { name, niceName } = getTemplateDefinition(templateName);
            const label = name === item.label ? niceName : item.label;

            return (
              <ListAction
                css={css({
                  color: 'foreground',
                  paddingX: 0,
                  '> div': { width: '100%' },
                  label: {
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    height: 8,
                    paddingLeft: 9,
                    paddingRight: 3,
                  },
                  'label:before': { left: 3, top: 2 },
                  // the checkmark is optically centered
                  'label:after': { left: '15px', top: '13px' },
                })}
              >
                <Checkbox
                  key={item.label}
                  checked={item.isRefined}
                  onChange={() => {
                    setRefinementList({
                      ...refinementList,
                      [attribute]: item.value,
                    });
                    inputRef.current.value = '';
                  }}
                  label={
                    <Stack justify="space-between" css={{ flexGrow: 1 }}>
                      <Text maxWidth="100%" size={3}>
                        {label}
                      </Text>
                      <Text variant="muted" size={3}>
                        {formatNumber(item.count)}
                      </Text>
                    </Stack>
                  }
                />
              </ListAction>
            );
          })}
          {items.length === 0 && (
            <Text size={3} variant="muted" marginX={3}>
              No {prettyAttribute} found
            </Text>
          )}
        </List>
        <Element
          css={css({
            paddingX: 3,
            borderBottom: '1px solid',
            borderColor: 'menuList.border',
          })}
        />
      </Stack>
    );
  }
);
