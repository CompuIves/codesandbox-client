import React, { useState } from 'react';
import Down from 'react-icons/lib/fa/angle-down';
import Right from 'react-icons/lib/fa/angle-right';
import { Spring, animated } from 'react-spring/renderprops';

import { Title as TitleElement } from './elements';

interface Props {
  title: string;
  open?: boolean;
}

export const Title: React.FC<Props> = ({ open, title, children }) => {
  const [isOpen, setOpen] = useState(open || false);

  function toggleShow() {
    setOpen(!isOpen);
  }

  return (
    <>
      <TitleElement onClick={() => toggleShow()}>
        {isOpen ? <Down /> : <Right />}
        {title}
      </TitleElement>
      <Spring
        from={{ height: 'auto' }}
        to={{
          height: isOpen ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        {props => <animated.div style={props}>{children}</animated.div>}
      </Spring>
    </>
  );
};
