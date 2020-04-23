import { orderBy } from 'lodash-es';
import React, { FunctionComponent } from 'react';

import { useOvermind } from 'app/overmind';
import { Overlay as OverlayComponent } from 'app/components/Overlay';
import { Element, Text } from '@codesandbox/components';
import { Option } from './Option';

type Template = {
  id: string;
  name: string;
  color: string;
  niceName: string;
};
type Props = {
  possibleTemplates?: Template[];
};
export const FilterOptions: FunctionComponent<Props> = ({
  possibleTemplates = [],
}) => {
  const {
    actions: {
      dashboard: {
        blacklistedTemplateAdded,
        blacklistedTemplateRemoved,
        blacklistedTemplatesChanged,
        blacklistedTemplatesCleared,
      },
    },
    state: {
      dashboard: {
        filters: { blacklistedTemplates },
        isTemplateSelected,
      },
    },
  } = useOvermind();

  const toggleTemplate = (name: string, select: boolean) =>
    select ? blacklistedTemplateRemoved(name) : blacklistedTemplateAdded(name);
  const allSelected = possibleTemplates.every(({ id }) =>
    isTemplateSelected(id)
  );

  const Overlay = () => (
    <Element>
      {possibleTemplates.length > 0 ? (
        <>
          {orderBy(possibleTemplates, 'niceName').map(
            ({ color, id, name, niceName }) => {
              const selected = isTemplateSelected(id);

              return (
                <Option
                  color={color}
                  id={id}
                  key={name}
                  niceName={niceName || name}
                  selected={selected}
                  toggleTemplate={toggleTemplate}
                />
              );
            }
          )}

          <Option
            color="#374140"
            id="all"
            niceName="Select All"
            selected={allSelected}
            style={{ marginTop: '1rem' }}
            toggleTemplate={() => {
              if (allSelected) {
                return blacklistedTemplatesChanged(
                  possibleTemplates.map(({ id }) => id)
                );
              }

              return blacklistedTemplatesCleared();
            }}
          />
        </>
      ) : (
        'No environments found'
      )}
    </Element>
  );

  const templateCount = possibleTemplates.length - blacklistedTemplates.length;
  const templateMessage =
    templateCount === possibleTemplates.length && templateCount > 0
      ? 'all environments'
      : `${Math.max(0, templateCount)} ${
          templateCount === 1 ? 'environment' : 'environments'
        }`;

  return (
    <OverlayComponent
      width={200}
      content={Overlay}
      event="Dashboard - Order By"
    >
      {open => (
        <Element>
          Showing <Text onClick={open}>{templateMessage}</Text>
        </Element>
      )}
    </OverlayComponent>
  );
};
