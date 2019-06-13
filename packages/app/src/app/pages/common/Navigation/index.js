import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import Media from 'react-media';
import {
  patronUrl,
  searchUrl,
  exploreUrl,
} from '@codesandbox/common/lib/utils/url-generator';

import SearchIcon from 'react-icons/lib/go/search';
import PlusIcon from 'react-icons/lib/go/plus';
import BellIcon from 'react-icons/lib/md/notifications';
import FlameIcon from 'react-icons/lib/go/flame';
import Row from '@codesandbox/common/lib/components/flex/Row';
import Tooltip from '@codesandbox/common/lib/components/Tooltip';
import PatronBadge from '-!svg-react-loader!@codesandbox/common/lib/utils/badges/svg/patron-4.svg'; // eslint-disable-line import/no-webpack-loader-syntax
import HeaderSearchBar from 'app/components/HeaderSearchBar';
import OverlayComponent from 'app/components/Overlay';
import Notifications from './Notifications';

import SignInButton from '../SignInButton';
import UserMenu from '../UserMenu';
import {
  LogoWithBorder,
  Border,
  Title,
  Actions,
  Action,
  UnreadIcon,
  TitleWrapper,
  Wrapper,
} from './elements';

function Navigation({ signals, store, title, searchNoInput }) {
  const { isLoggedIn, isPatron, user } = store;

  return (
    <Row justifyContent="space-between">
      <TitleWrapper>
        <a href="/?from-app=1">
          <LogoWithBorder height={35} width={35} />
        </a>
        <Border width={1} size={500} />
        <Title>{title}</Title>
      </TitleWrapper>
      <Wrapper>
        <Actions>
          <Action>
            <Media query="(max-width: 920px)">
              {matches =>
                matches || searchNoInput ? (
                  <Tooltip placement="bottom" content="Search All Sandboxes">
                    <Link style={{ color: 'white' }} to={searchUrl()}>
                      <SearchIcon height={35} />
                    </Link>
                  </Tooltip>
                ) : (
                  <HeaderSearchBar />
                )
              }
            </Media>
          </Action>

          <Action>
            <Tooltip placement="bottom" content="Explore Sandboxes">
              <a style={{ color: 'white' }} href={exploreUrl()}>
                <FlameIcon />
              </a>
            </Tooltip>
          </Action>

          {!isPatron && (
            <Action>
              <Tooltip placement="bottom" content="Support CodeSandbox">
                <Link to={patronUrl()}>
                  <PatronBadge width={40} height={40} />
                </Link>
              </Tooltip>
            </Action>
          )}

          {user && (
            <OverlayComponent
              isOpen={store.userNotifications.notificationsOpened}
              Overlay={Notifications}
              onOpen={signals.userNotifications.notificationsOpened}
              onClose={signals.userNotifications.notificationsClosed}
              event="Notifications"
              noHeightAnimation
            >
              {open => (
                <Action
                  style={{ placement: 'relative', fontSize: '1.25rem' }}
                  onClick={open}
                >
                  <Tooltip placement="bottom" content={store.userNotifications.unreadCount > 0 ? 'Show Notifications' : 'No Notifications'}>
                    <BellIcon height={35} />
                    {store.userNotifications.unreadCount > 0 && (
                      <UnreadIcon count={store.userNotifications.unreadCount} />
                    )}
                  </Tooltip>
                </Action>
              )}
            </OverlayComponent>
          )}

          <Action
            style={{ fontSize: '1.125rem' }}
            onClick={() =>
              signals.modalOpened({
                modal: 'newSandbox',
              })
            }
          >
            <Tooltip placement="bottom" content="New Sandbox">
              <PlusIcon height={35} />
            </Tooltip>
          </Action>
        </Actions>

        {isLoggedIn ? <UserMenu /> : <SignInButton />}
      </Wrapper>
    </Row>
  );
}
export default inject('store', 'signals')(observer(Navigation));
