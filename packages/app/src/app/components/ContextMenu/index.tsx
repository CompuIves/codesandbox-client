import React, { FunctionComponent } from 'react';

import { ENTER } from '@codesandbox/common/lib/utils/keycodes';
import { Spring } from 'react-spring/renderprops';
import {
  useMenuState,
  Menu,
  MenuDisclosure,
  MenuItem,
  MenuGroup,
} from 'reakit/Menu';

import { Container, Item, ItemContainer } from './elements';

type OnContextMenu = (event: React.MouseEvent) => void;

interface ItemType {
  color?: string;
  title: string;
  icon?: React.ElementType;
  action: () => boolean | void;
}

type Item = ItemType | ItemType[];

type ChildFunction = (
  onContextMenu: OnContextMenu,
  disclosureProps: unknown
) => React.ReactNode;
type ChildrenProps = {
  children: React.ReactNode | JSX.Element | ChildFunction;
};

type Props = {
  items: Item[];
  onContextMenu?: OnContextMenu;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
  isDraggingItem?: boolean;
  name: string;
} & ChildrenProps;

export const ContextMenu: FunctionComponent<Props> = ({
  children,
  items,
  isDraggingItem,
  onContextMenu,
  name,
  ...props
}) => {
  const menu = useMenuState({
    placement: 'bottom-end',
    unstable_animated: true,
  });

  const mapFunction = (item: ItemType, i: number) => {
    if (Array.isArray(item)) {
      if (item.length === 0) {
        return null;
      }
      return (
        <MenuGroup as={ItemContainer} {...menu} key={i}>
          {item.map(mapFunction)}
        </MenuGroup>
      );
    }

    const handlePress = (
      e:
        | React.MouseEvent<HTMLButtonElement>
        | React.KeyboardEvent<HTMLButtonElement>
    ) => {
      if (item.action()) {
        e.preventDefault();
        menu.hide();
      }
    };

    return (
      <MenuItem
        {...menu}
        as={Item}
        key={item.title}
        color={item.color}
        onMouseDown={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseUp={e => {
          handlePress(e);
        }}
        onKeyUp={e => {
          if (e.keyCode === ENTER) {
            handlePress(e);
          }
        }}
      >
        {item.icon && <item.icon />}
        {item.title}
      </MenuItem>
    );
  };

  const onMenuEvent: OnContextMenu = event => {
    const { clientX, clientY, preventDefault } = event;

    preventDefault();

    const referenceObj = {
      getBoundingClientRect: () => ({
        top: clientY,
        right: clientX,
        bottom: clientY,
        left: clientX,
      }),
      clientWidth: 0,
      clientHeight: 0,
    };

    // @ts-ignore
    menu.unstable_referenceRef.current = referenceObj;

    // necessary for subsequent right clicks
    menu.hide();
    menu.show();

    if (onContextMenu) {
      onContextMenu(event);
    }
  };

  return (
    <div
      {...props}
      onContextMenu={typeof children === 'function' ? undefined : onMenuEvent}
    >
      <MenuDisclosure {...menu}>
        {disclosureProps =>
          typeof children === 'function'
            ? children(onMenuEvent, disclosureProps)
            : children
        }
      </MenuDisclosure>
      {menu.visible && (
        <Spring
          onRest={menu.unstable_stopAnimation}
          force
          // @ts-ignore
          from={{ opacity: 0.6, height: 0 }}
          to={{ opacity: 1, height: 'auto' }}
        >
          {style => (
            <Menu
              unstable_portal
              as={Container}
              {...menu}
              aria-label={`menu ${name}`}
              style={style}
            >
              {items.map(mapFunction)}
            </Menu>
          )}
        </Spring>
      )}
    </div>
  );
};
