import React from 'react';

import {
  Avatar,
  Button,
  Collapsible,
  Element,
  Input,
  List,
  ListItem,
  Select,
  Stack,
  Switch,
  Text,
} from '..';
import { sara, sid } from '../components/Avatar/stubs';

export default {
  title: 'examples/SandboxLive',
};

const LiveIcon = props => (
  <Element
    as="svg"
    width="8"
    height="8"
    viewBox="0 0 8 8"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="4" cy="4" r="4" fill="currentcolor" />
  </Element>
);

const GlobeIcon = () => (
  <svg width={10} height={10} fill="none" viewBox="0 0 10 10">
    <path
      fill="#757575"
      d="M9.33 2.643A4.781 4.781 0 007.51.986 5.264 5.264 0 005 .375c-.907 0-1.744.204-2.51.61A4.78 4.78 0 00.67 2.644 4.153 4.153 0 000 4.929c0 .826.224 1.587.67 2.285a4.783 4.783 0 001.82 1.657c.766.408 1.603.611 2.51.611.907 0 1.744-.203 2.51-.61a4.78 4.78 0 001.82-1.658c.447-.698.67-1.46.67-2.285 0-.827-.223-1.589-.67-2.286zM5.626 7.324c-.044-.047-.06-.087-.046-.118-.004.02-.02.037-.046.053a.61.61 0 00-.117-.089.604.604 0 01-.117-.089 2.53 2.53 0 01-.146-.228c-.011-.026-.012-.04-.004-.045-.082.032-.202.01-.358-.065a.617.617 0 01-.136-.124c-.061-.068-.124-.097-.19-.09l-.087.021a.37.37 0 01-.095.015.321.321 0 01-.104-.024.87.87 0 01-.14-.068 47.905 47.905 0 00-.205-.104l-.104-.047a.319.319 0 01-.081-.056.186.186 0 01-.056-.08 1.053 1.053 0 01-.032-.142.416.416 0 00-.052-.155.551.551 0 00-.11-.118c-.049-.04-.092-.06-.131-.06.035 0 .035-.026 0-.08a.607.607 0 00-.091-.115 7.751 7.751 0 01-.189-.19.472.472 0 01-.078-.11c-.022-.041-.026-.076-.013-.103.004-.004 0-.01-.013-.018a1.187 1.187 0 00-.104-.044.139.139 0 00-.04-.01.425.425 0 01.03.087c.01.041.023.072.036.091.008.016.045.074.11.172.113.166.165.289.157.368-.026.008-.044.004-.053-.012a.201.201 0 01-.02-.065.343.343 0 00-.012-.06c-.013-.023-.047-.049-.101-.076-.054-.028-.088-.056-.101-.083.004 0 .01-.002.016-.006a.033.033 0 01.017-.006c.004-.036-.019-.081-.069-.137-.05-.055-.07-.095-.062-.118-.034-.024-.065-.07-.09-.14a.502.502 0 00-.066-.133.266.266 0 00-.065-.062 1.302 1.302 0 00-.098-.06 2.892 2.892 0 01-.078-.044.238.238 0 01-.052-.053c-.143-.158-.186-.243-.13-.255-.056.012-.103-.027-.14-.116-.037-.089-.049-.157-.036-.204l-.013-.006a.803.803 0 00.007-.14c0-.077.005-.147.016-.21.01-.063.032-.095.062-.095-.03.004-.053-.021-.068-.074-.016-.054-.017-.09-.004-.11.005-.012.024-.004.059.024a.32.32 0 01.058.053c.057-.028.079-.063.066-.107a.856.856 0 00-.137-.124 2.484 2.484 0 00-.287-.16c.026-.044.02-.081-.02-.113-.043.024-.068.03-.074.018a.213.213 0 01-.016-.065c-.005-.032-.016-.05-.033-.054a.175.175 0 01-.078-.047c.386-.561.896-1 1.53-1.316.026-.004.074-.006.143-.006a.278.278 0 01.098.03c.03.015.062.037.094.065.033.027.058.047.075.059.009-.024-.002-.06-.033-.107.01-.024.057-.047.144-.071.1-.012.165-.01.195.006a1.59 1.59 0 00-.13-.148l-.033.03c-.034-.028-.126-.015-.273.04l-.065.033a.792.792 0 01-.085.039.175.175 0 01-.078.006c.208-.103.412-.184.612-.243a.632.632 0 01.065.05.94.94 0 00.072.056c-.013-.008-.022-.004-.026.012-.018.048-.018.087 0 .119a.124.124 0 00.088.047.531.531 0 00.133-.006.887.887 0 01.104-.012l.065.006c.14.012.193 0 .163-.035a.364.364 0 01.046.098c.017.049.037.084.058.103.022-.016.026-.043.013-.083-.013-.04-.013-.067 0-.083.004-.008.018-.016.04-.023a8.204 8.204 0 01.13-.048c.026-.016.008-.043-.053-.083a.473.473 0 00-.055-.018 1 1 0 01-.075-.023.43.43 0 01-.068-.033c-.024-.014-.035-.03-.033-.047a.154.154 0 01.036-.069c.026-.02.069-.027.127-.023a.348.348 0 01.134.03c.117.059.134.112.052.16a.5.5 0 01.156.047c.06.027.085.057.072.089.034-.06.069-.09.104-.09.021.005.042.031.062.08.02.05.031.077.035.081.035.043.07.053.105.03a.524.524 0 00.107-.104c.037-.046.057-.066.062-.062-.044-.016-.048-.032-.013-.048.065-.035.123-.045.176-.03.012.008.03.026.051.054.04.071.033.105-.019.1a.123.123 0 01.049.12c-.007.047-.04.068-.101.064a.247.247 0 01-.095-.03.311.311 0 00-.094-.032c-.022-.002-.052.01-.091.033a.743.743 0 00-.069.1.455.455 0 01-.075.101c-.065.06-.173.082-.325.066.013 0 .012.011-.003.035a1.234 1.234 0 01-.107.13.294.294 0 00-.079.137l-.006.08a.276.276 0 01-.027.104c.053-.012.094.012.124.071.026.055.026.085 0 .089a.84.84 0 01.378.024c.156.051.245.103.267.154.026-.036.089-.038.189-.006.039.02.073.079.104.178.017.059.046.11.088.154.041.043.085.055.133.035l.02-.011a.63.63 0 00.042-.021.276.276 0 00.036-.024c.013-.01.02-.019.022-.026.002-.008 0-.016-.01-.024a.213.213 0 01-.068-.098c-.015-.041-.011-.078.01-.11a.433.433 0 01.104-.07c.057-.033.092-.064.105-.096.017-.051-.005-.094-.066-.127-.06-.034-.09-.065-.09-.092 0-.02.013-.044.042-.071.028-.028.04-.054.035-.077A.268.268 0 006 2.263a.38.38 0 01-.026-.083c-.003-.017.007-.038.029-.062.03-.016.102-.015.215.003a.781.781 0 01.221.056c.013.008.041.02.085.036a.819.819 0 01.114.05c.032.018.05.035.055.05H6.66a.14.14 0 01.056.084c.006.031-.01.055-.049.07a.223.223 0 01.104.019c.07.023.072.045.007.065a.452.452 0 01.055-.012.184.184 0 00.088-.039.109.109 0 01.03-.017.226.226 0 01.028-.006.057.057 0 01.04.009c.004 0 .013-.01.029-.03l.048-.06c.018-.019.033-.029.046-.029.013 0 .025.005.036.015.01.01.02.02.026.033a.753.753 0 01.035.07c.009.02.03.041.062.063a.165.165 0 01.062.062l.026.09c.013.047.03.08.052.097a.264.264 0 00.098.044c.008.004.028.002.058-.005a.17.17 0 01.075-.006c.02.003.03.02.03.047.025-.024.038-.04.038-.047a.235.235 0 00.043.124c.024.032.062.046.114.042l-.013.13c-.013.02-.046.035-.098.044a.381.381 0 00-.098.027.445.445 0 00-.094.071c-.05.044-.07.07-.062.077-.074-.075-.184-.096-.332-.065a1.773 1.773 0 00-.338.071.477.477 0 00-.144.09.18.18 0 00-.022.04l-.033.066c-.01.02-.02.03-.03.03.027-.004.056-.023.089-.057a.363.363 0 01.062-.056c.112-.067.206-.09.28-.07.095.023.11.055.045.094-.008.008-.031.011-.068.01a.257.257 0 00-.075.002c.04.008.072.019.098.033.026.013.032.032.02.056.069.036.082.075.039.119a.25.25 0 01-.202.065c.013 0 .013.008 0 .024l-.111.065a1.466 1.466 0 01-.085.03.225.225 0 00-.097.053c-.013.016-.02.04-.02.07a.287.287 0 01-.006.072c-.005.016-.022.02-.052.012-.014.024-.054.042-.12.056-.068.014-.113.035-.134.062.026.032.024.064-.007.095-.052.04-.098.036-.137-.012-.021.008-.038.028-.048.06a.11.11 0 01-.05.065c.031.043.027.075-.012.095a.496.496 0 01.078.042c.017.011.028.017.032.017-.017.036-.04.053-.071.053.026.064-.007.133-.098.208a.304.304 0 01-.081.047c-.037.016-.07.03-.101.039a.223.223 0 00-.052.02.412.412 0 00-.098.11.118.118 0 00-.01.11c.015.036.056.06.12.071l.007.048v.106l.007.048.01.074a.536.536 0 010 .083c-.003.034-.012.052-.03.056-.017.004-.041 0-.071-.012-.035-.015-.076-.102-.124-.26a.383.383 0 00-.078-.143.196.196 0 01-.056.039c-.015.006-.026.007-.032.003a.42.42 0 01-.036-.027.433.433 0 00-.045-.032.371.371 0 00-.114-.03c-.055-.008-.088-.018-.101-.03-.105.072-.168.054-.19-.053-.008.02-.007.046.004.08s.016.053.016.056c-.03.052-.078.056-.143.012-.026-.023-.086-.026-.179-.009-.093.018-.155.021-.185.01.004 0 .013.005.026.017a.179.179 0 01.026.018.073.073 0 01-.02.035c-.009.008-.017.011-.026.01a.072.072 0 00-.03 0 .118.118 0 00-.029.008.384.384 0 00-.065.062.31.31 0 01-.058.057.362.362 0 01.036.145 1.635 1.635 0 01-.02.148 1 1 0 00-.016.157c0 .063.02.137.061.22.042.083.09.14.147.172.03.015.083.025.156.03.074.003.126 0 .156-.013a.159.159 0 00.06-.041.192.192 0 00.032-.068c.008-.03.015-.05.02-.063a.178.178 0 01.168-.118c.053-.004.09 0 .114.015.024.013.034.032.03.056a.28.28 0 01-.026.074c-.013.026-.03.054-.05.086a.314.314 0 00-.035.071.906.906 0 00-.023.134.672.672 0 01-.016.104.414.414 0 00.098.005.13.13 0 01.01-.038.156.156 0 00.01-.033c.02.032.056.05.103.054.048.004.083-.012.105-.048.008.012.034.042.078.09.043.047.067.086.071.118l.026.077c.013.036.018.06.013.074-.004.014-.026.021-.065.021-.017 0-.028.006-.032.018a.074.074 0 000 .044.372.372 0 00.042.101.105.105 0 01.016.032c.079.13.185.166.32.107 0 .115-.03.178-.092.19-.034.008-.073-.012-.116-.06zm.097 1.34a.434.434 0 01-.013-.095c-.004-.031.011-.074.046-.127.034-.054.052-.094.052-.122-.07-.016-.096-.067-.079-.154.01-.06.072-.138.19-.237.082-.067.108-.162.077-.285a1.502 1.502 0 01-.032-.225 1.845 1.845 0 00-.026-.208c0 .012.02.023.062.033.041.01.066.023.075.038a.345.345 0 00.032-.065.292.292 0 01.039-.071.216.216 0 01.055-.045.646.646 0 01.056-.032.502.502 0 00.058-.039l.075-.05a.23.23 0 01.078-.026c.033-.006.056.002.069.026.021.024.017.06-.013.11s-.03.084 0 .104a.407.407 0 00.013-.078.137.137 0 01.039-.089.152.152 0 01.075-.04.1.1 0 01.065.008c.02.01.042.023.068.041.026.018.05.029.072.033.065.02.143.063.234.13-.004-.004-.004-.009 0-.015a.068.068 0 01.026-.017.507.507 0 00.036-.018.192.192 0 01.035-.015l.02-.006c.03 0 .052-.002.065-.006.013-.004.032 0 .055.012a.456.456 0 01.095.06.558.558 0 01.045.035 4.836 4.836 0 00.153.089c.02.012.037.03.052.053.015.024.02.05.016.077.027.004.079.02.157.048.013.007.04.014.081.02s.069.015.082.027a4.155 4.155 0 01-2.285 1.12z"
    />
  </svg>
);

export const NotLive = () => (
  <Element
    as="aside"
    css={{
      width: '200px',
      height: '100vh',
      borderRight: '1px solid',
      borderColor: 'sideBar.border',
    }}
  >
    <Collapsible title="Live" defaultOpen>
      <Element css={{ paddingX: 2 }}>
        <Text block marginBottom={2}>
          Collaborate in real-time
        </Text>

        <Stack direction="vertical" gap={2} marginBottom={6}>
          <Text size={2} variant="muted" block>
            Invite others to live edit this sandbox with you.
          </Text>

          <Text size={2} variant="muted" block>
            To invite others you need to generate a URL that others can join.
          </Text>
        </Stack>

        <Button variant="danger">
          <LiveIcon css={{ marginRight: 1 }} /> Go Live
        </Button>
      </Element>
    </Collapsible>
  </Element>
);

export const Live = () => (
  <Element
    as="aside"
    css={{
      width: '200px',
      height: '100vh',
      borderRight: '1px solid',
      borderColor: 'sideBar.border',
    }}
  >
    <Collapsible title="Live" defaultOpen>
      <Element css={{ paddingX: 2 }}>
        <Stack justify="space-between" align="center" marginBottom={2}>
          <Text variant="danger">
            <Stack align="center" gap={2}>
              <LiveIcon />

              <span>You&apos;re live!</span>
            </Stack>
          </Text>

          <Text variant="danger">
            <span>00:02</span>
          </Text>
        </Stack>

        <Text variant="muted" size={2} block marginBottom={4}>
          Share this link with others to invite them to the session
        </Text>

        <Input
          defaultValue="https://codesandbox.io/live/aiusdba"
          marginBottom={2}
        />

        <Button variant="danger">
          <LiveIcon css={{ marginRight: 1 }} /> Stop Session
        </Button>
      </Element>
    </Collapsible>

    <Collapsible title="Preferences" defaultOpen>
      <List>
        <ListItem justify="space-between">
          <Text as="label" htmlFor="chat_enabled">
            Chat enabled
          </Text>

          <Switch id="chat_enabled" defaultOn />
        </ListItem>

        <ListItem justify="space-between">
          <Text as="label" htmlFor="show_notifications">
            Show notifications
          </Text>

          <Switch id="show_notifications" />
        </ListItem>
      </List>
    </Collapsible>

    <Collapsible title="Privacy" defaultOpen>
      <Stack direction="vertical" gap={2} css={{ paddingX: 2 }}>
        <Select
          Icon={GlobeIcon}
          defaultValue="open"
          placeholder="Please select an option"
        >
          <option value="open">Open</option>

          <option value="classroom">Classroom</option>
        </Select>

        <Text variant="muted" size={2}>
          Everyone can edit
        </Text>
      </Stack>
    </Collapsible>

    <Collapsible title="Owners" defaultOpen>
      <Stack direction="vertical" gap={6} css={{ paddingX: 2 }}>
        <Stack gap={2} align="center">
          <Avatar user={sara} />

          <span>
            <Text size={2} block>
              {sara.name}
            </Text>

            <Text size={2} variant="muted" block>
              Owner (you)
            </Text>
          </span>
        </Stack>

        <Element>
          <Text weight="medium" block marginBottom={2}>
            Users
          </Text>

          <Stack gap={1} css={{ flexWrap: 'wrap' }}>
            <Avatar user={sid} />

            <Avatar user={sara} />

            <Avatar user={sara} />

            <Avatar user={sid} />

            <Avatar user={sid} />

            <Avatar user={sara} />

            <Avatar user={sid} />
          </Stack>
        </Element>
      </Stack>
    </Collapsible>
  </Element>
);
