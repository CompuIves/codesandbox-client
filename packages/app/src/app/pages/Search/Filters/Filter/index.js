import React, { useCallback, useState } from 'react';
import Down from 'react-icons/lib/md/expand-more';
import Up from 'react-icons/lib/md/expand-less';
import { RefinementList } from 'react-instantsearch-dom';

import { Button, Container, Title } from './elements';

const Filter = ({
  attributeName,
  noSearch,
  operator,
  title,
  transformItems,
}) => {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    setOpen(isOpen => !isOpen);
  }, []);

  return (
    <Container open={open}>
      <Title>
        <span>{title}</span>

        <Button onClick={toggle}>{open ? <Up /> : <Down />}</Button>
      </Title>

      <RefinementList
        transformItems={transformItems}
        searchable={!noSearch}
        showMore={!noSearch}
        operator={operator}
        attribute={attributeName}
      />
    </Container>
  );
};

export default Filter;
