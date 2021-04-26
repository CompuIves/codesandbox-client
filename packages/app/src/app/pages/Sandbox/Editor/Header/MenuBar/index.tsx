import track from '@codesandbox/common/lib/utils/analytics';
import { useEffects } from 'app/overmind';
import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';

import { MenuAppItems } from 'app/overmind/effects/vscode/composeMenuAppTree';
import { Icon, Menu, Stack } from '@codesandbox/components';

import { Container, MenuHandler } from './elements';

import { formatMenuData } from './formatMenuData';
import { SubMenu } from './SubMenu';

export const MenuBar: FunctionComponent = () => {
  const [menu, setMenu] = useState<MenuAppItems>([]);

  const { vscode } = useEffects();
  const vscodeMenuItems = vscode.getMenuAppItems();

  useEffect(
    function loadMenuItemsFromVscode() {
      setMenu(vscodeMenuItems);
    },
    [vscodeMenuItems]
  );

  // const renderSubMenu = (submenu: Unpacked<MenuAppItems>['submenu']) =>
  //   submenu.map(subItem => {
  //     if (subItem.submenu) {
  //       return (
  //         <div className="menu">
  //           <p>
  //             {subItem.title} {'>'}
  //           </p>
  //           <div className="menu sub-menu">
  //             {renderSubMenu(subItem.submenu)}
  //           </div>
  //         </div>
  //       );
  //     }

  //     if (subItem.command) {
  //       const when = vscode.contextMatchesRules(subItem.command.when);
  //       const toggled = vscode.contextMatchesRules(subItem.command.toggled);
  //       const disabled = vscode.contextMatchesRules(
  //         subItem.command.precondition
  //       );

  //       if (when === false) return null;

  //       return (
  //         <div className="item">
  //           <button
  //             type="button"
  //             onClick={() => vscode.runCommand(subItem.command.id)}
  //             style={{
  //               opacity: disabled ? 1 : 0.4,
  //             }}
  //           >
  //             {'toggled' in subItem.command && toggled && '✅'}
  //             {subItem.command.title}
  //           </button>

  //           {vscode.lookupKeybinding(subItem.command.id)?.getLabel()}
  //         </div>
  //       );
  //     }

  //     return null;
  //   });

  const menuByGroup = useMemo(() => formatMenuData(menu), [menu]);

  return (
    // Explicitly use inline styles here to override the vscode styles
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <Container onClick={() => track('Editor - Click Menubar')}>
      <Menu>
        <MenuHandler as={Menu.Button} type="button">
          <Icon width={14} height={10} name="menu" />
        </MenuHandler>

        <Menu.List>
          {menuByGroup.map((group, groupIndex, innerArr) => (
            <SubMenu
              group={group}
              groupIndex={groupIndex}
              innerArr={innerArr}
            />
          ))}
        </Menu.List>
      </Menu>
    </Container>
  );
};
