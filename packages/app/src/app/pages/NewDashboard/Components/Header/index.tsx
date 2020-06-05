import React from 'react';
import { useLocation } from 'react-router-dom';
import { Stack, Text, Button } from '@codesandbox/components';
import css from '@styled-system/css';
import { Breadcrumbs } from '../Breadcrumbs';
import { FilterOptions } from '../Filters/FilterOptions';
import { ViewOptions } from '../Filters/ViewOptions';
import { SortOptions } from '../Filters/SortOptions';

type Props = {
  templates?: any[];
  path?: string;
  title?: string;
  createNewFolder?: () => void;
  showFilters?: boolean;
  showViewOptions?: boolean;
  showSortOptions?: boolean;
};

export const Header = ({
  createNewFolder,
  templates,
  path,
  title,
  showFilters = false,
  showViewOptions = false,
  showSortOptions = false,
}: Props) => {
  const location = useLocation();

  return (
    <Stack
      align="center"
      justify="space-between"
      marginX={4}
      paddingBottom={2}
      css={css({
        borderStyle: 'solid',
        borderWidth: 0,
        borderBottomWidth: 1,
        borderColor: 'grays.500',
      })}
    >
      {title ? (
        <Text marginBottom={1} block weight="bold" size={5}>
          {title}
        </Text>
      ) : (
        <Breadcrumbs param={path} />
      )}
      <Stack gap={4} align="center">
        {location.pathname.includes('all') &&
          !location.pathname.includes('all/drafts') && (
            <Button
              onClick={createNewFolder}
              variant="link"
              css={css({
                fontSize: 2,
                color: 'mutedForeground',
                padding: 0,
                width: 'auto',
              })}
            >
              + New Folder
            </Button>
          )}

        <Stack gap={4}>
          {showFilters && <FilterOptions possibleTemplates={templates} />}
          {showSortOptions && <SortOptions />}
          {showViewOptions && <ViewOptions />}
        </Stack>
      </Stack>
    </Stack>
  );
};
