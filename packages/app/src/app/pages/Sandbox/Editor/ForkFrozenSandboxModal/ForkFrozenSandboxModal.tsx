import Modal from 'app/components/Modal';
import { withTheme } from 'styled-components';
import { ThemeProvider } from '@codesandbox/components';
import { Alert } from 'app/pages/common/Modals/Common/Alert';
import { useOvermind } from 'app/overmind';
import React, { FunctionComponent } from 'react';
import useKeyPressEvent from 'react-use/lib/useKeyPressEvent';

const ModalContent: React.FC = () => {
  const {
    state: {
      editor: {
        currentSandbox: { customTemplate },
      },
    },
    actions: { modals: modalsActions },
  } = useOvermind();
  const type = customTemplate ? 'template' : 'sandbox';

  const unlock = () => {
    modalsActions.forkFrozenModal.close('unfreeze');
  };

  const fork = (event?: { defaultPrevented: boolean }) => {
    if (event && !event.defaultPrevented) {
      modalsActions.forkFrozenModal.close('fork');
    }
  };

  useKeyPressEvent('Enter', fork);
  return (
    <Alert
      title={`Frozen ${customTemplate ? 'Template' : 'Sandbox'}`}
      description={
        <>
          <p>
            This {type} is frozen, which means you can’t make edits without
            unfreezing it.
          </p>
          <p>
            Do you want to unfreeze the {type} for this session or make a fork?
          </p>
        </>
      }
      onCancel={unlock}
      cancelMessage="Unfreeze"
      onPrimaryAction={fork}
      confirmMessage="Fork"
    />
  );
};

const ForkFrozenSandboxModalComponent: FunctionComponent<{ theme: any }> = ({
  theme,
}) => {
  const {
    state: { modals },
    actions: { modals: modalsActions },
  } = useOvermind();

  return (
    <ThemeProvider theme={theme.vscodeTheme}>
      <Modal
        isOpen={modals.forkFrozenModal.isCurrent}
        width={450}
        onClose={() => modalsActions.forkFrozenModal.close('cancel')}
      >
        <ModalContent />
      </Modal>
    </ThemeProvider>
  );
};

export const ForkFrozenSandboxModal = withTheme(
  ForkFrozenSandboxModalComponent
);
