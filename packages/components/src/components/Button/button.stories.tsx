import React from 'react';

import { Stack } from '../..';

import { Button } from '.';

export default {
  title: 'components/Button',
  component: Button,
};

// TODO: Replace the text inside with Text variants when available
export const Basic = () => <Button>Create Sandbox, it’s free</Button>;

export const Variants = () => (
  <Stack direction="vertical" gap={4} style={{ width: 200 }}>
    <Button variant="primary">primary by default</Button>

    <Button variant="secondary">Save as Template</Button>

    <Button variant="link">Open sandbox</Button>

    <Button variant="danger">Go live</Button>
  </Stack>
);

export const Disabled = () => (
  <Stack direction="vertical" gap={4} style={{ width: 200 }}>
    <Button disabled variant="primary">
      primary by default
    </Button>

    <Button disabled variant="secondary">
      Save as Template
    </Button>

    <Button disabled variant="link">
      Open sandbox
    </Button>

    <Button disabled variant="danger">
      Go live
    </Button>
  </Stack>
);
