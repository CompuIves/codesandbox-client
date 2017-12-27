import * as React from 'react';
import { inject, observer } from 'mobx-react';
import Sandbox from './Sandbox';

import { Padding } from './elements';

function SelectSandbox({ store, signals }) {
  if (store.profile.isLoadingSandboxes)
    return <Padding>Loading sandboxes...</Padding>;

  const currentShowcasedSandboxId =
    store.profile.showcasedSandbox && store.profile.showcasedSandbox.id;

  return (
    <div>
      {store.profile.userSandboxes
        .filter(x => x)
        .map(sandbox => (
          <Sandbox
            active={sandbox.id === currentShowcasedSandboxId}
            key={sandbox.id}
            sandbox={sandbox}
            setShowcasedSandbox={id =>
              signals.profile.newSandboxShowcaseSelected({ id })
            }
          />
        ))}
    </div>
  );
}
export default inject('signals', 'store')(observer(SelectSandbox));
