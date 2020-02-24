import Relative from '@codesandbox/common/lib/components/Relative';
import React, { FunctionComponent } from 'react';

import { useMenuState, MenuDisclosure } from 'reakit/Menu';
import { useOvermind } from 'app/overmind';

import {
  UserMenuContainer,
  ClickableContainer,
  ProfileImage,
} from './elements';
import { Menu } from './Menu';

export const UserMenu: FunctionComponent = props => {
  const {
    actions: {
      modalOpened,
      signOutClicked,
      files: { gotUploadedFiles },
    },
    state: { user },
  } = useOvermind();
  const menu = useMenuState({
    placement: 'bottom-end',
  });

  return (
    <UserMenuContainer>
      <Relative>
        <MenuDisclosure
          as={ClickableContainer}
          {...menu}
          aria-label="profile menu"
        >
          {props.children || (
            <ProfileImage
              alt={user.username}
              width={30}
              height={30}
              src={user.avatarUrl}
            />
          )}
        </MenuDisclosure>

        <Menu
          openPreferences={() => modalOpened({ modal: 'preferences' })}
          openStorageManagement={() => gotUploadedFiles(null)}
          signOut={() => signOutClicked()}
          username={user.username}
          curator={user.curatorAt}
          openFeedback={() => modalOpened({ modal: 'feedback' })}
          menuProps={menu}
          showPatron={user.subscription && user.subscription.plan === 'patron'}
          showManageSubscription={
            user.subscription && user.subscription.plan === 'pro'
          }
          showBecomePro={!user.subscription}
        />
      </Relative>
    </UserMenuContainer>
  );
};
