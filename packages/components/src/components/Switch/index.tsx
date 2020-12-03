import React from 'react';
import styled from 'styled-components';
import css from '@styled-system/css';
import { Element } from '../Element';

const SwitchBackground = styled.div(
  css({
    width: 7,
    height: 4,
    backgroundColor: 'switch.backgroundOff',
    border: '1px solid',
    borderColor: 'sideBar.background',
    borderRadius: 'large',
    position: 'relative',
    transition: 'background-color ease',
    transitionDuration: theme => theme.speeds[3],
  })
);

const SwitchToggle = styled.span(
  css({
    width: 3,
    height: 3,
    backgroundColor: 'switch.toggle',
    borderRadius: '50%',
    position: 'absolute',
    margin: '1px',
    left: 0,
    transition: 'left ease',
    transitionDuration: theme => theme.speeds[3],
    boxSizing: 'border-box',
  })
);

const SwitchInput = styled.input(
  css({
    width: 0,
    opacity: 0,
    position: 'absolute',
    left: -100,
  })
);

const SwitchContainer = styled(Element)(
  css({
    'input:checked + [data-component=SwitchBackground]': {
      backgroundColor: 'switch.backgroundOn',
    },
    'input:checked + [data-component=SwitchBackground] [data-component=SwitchToggle]': {
      left: theme => theme.space[4] - 4 + 'px',
    },
    '*': {
      boxSizing: 'border-box',
    },
  })
);

interface ISwitchProps {
  id?: string;
  on?: boolean;
  defaultOn?: boolean;
  disabled?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const Switch: React.FC<ISwitchProps> = ({
  on,
  defaultOn,
  disabled,
  ...props
}) => (
  <SwitchContainer as="label">
    <SwitchInput
      type="checkbox"
      checked={on}
      defaultChecked={defaultOn}
      disabled={disabled}
      {...props}
    />
    <SwitchBackground data-component="SwitchBackground">
      <SwitchToggle data-component="SwitchToggle" />
    </SwitchBackground>
  </SwitchContainer>
);
