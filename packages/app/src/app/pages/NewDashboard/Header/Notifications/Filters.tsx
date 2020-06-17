import React from 'react';
import { useOvermind } from 'app/overmind';
import { Stack, Menu, Checkbox } from '@codesandbox/components';
import css from '@styled-system/css';

export const Filters = () => {
  const {
    state: { userNotifications },
    actions: {
      userNotifications: {
        filterNotifications,
        markAllNotificationsAsRead,
        archiveAllNotifications,
      },
    },
  } = useOvermind();

  const options = {
    team_invite: 'Team Invite',
    team_accepted: 'Team Accepted',
    sandbox_invitation: 'Sandbox Invites',
  };

  const iconColor =
    userNotifications.activeFilters.length > 0
      ? 'button.background'
      : 'inherit';

  return (
    <Stack gap={2}>
      <Menu>
        <Menu.IconButton
          className="icon-button"
          name="filter"
          title="Filter Notifications"
          size={12}
          css={css({
            color: iconColor,
            ':hover:not(:disabled)': {
              color: iconColor,
            },
            ':focus:not(:disabled)': {
              color: iconColor,
              backgroundColor: 'transparent',
            },
          })}
        />
        <Menu.List>
          {Object.entries(options).map(([key, label]) => (
            <Menu.Item key={key} onSelect={() => filterNotifications(key)}>
              <Checkbox
                checked={userNotifications.activeFilters.includes(key)}
                label={label}
              />
            </Menu.Item>
          ))}
        </Menu.List>
      </Menu>

      <Menu>
        <Menu.IconButton
          className="icon-button"
          name="more"
          title="Notification actions"
          size={12}
        />
        <Menu.List>
          <Menu.Item onSelect={() => archiveAllNotifications()}>
            Clear all notifications
          </Menu.Item>
          <Menu.Item
            onSelect={() => {
              markAllNotificationsAsRead();
            }}
          >
            Mark all notifications as read
          </Menu.Item>
        </Menu.List>
      </Menu>
    </Stack>
  );
};
