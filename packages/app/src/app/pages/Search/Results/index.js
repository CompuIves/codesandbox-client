import Centered from '@codesandbox/common/lib/components/flex/Centered';
import SandboxCard from '@codesandbox/common/lib/components/SandboxCard';
import Margin from '@codesandbox/common/lib/components/spacing/Margin';
import { getSandboxName } from '@codesandbox/common/lib/utils/get-sandbox-name';
import { sandboxUrl } from '@codesandbox/common/lib/utils/url-generator';
import React from 'react';
import { Hits, Pagination } from 'react-instantsearch-dom';

import ResultInfo from '../ResultInfo';
import { Container } from './elements';

const selectSandbox = ({ alias, git, objectID }) =>
  window.open(sandboxUrl({ alias, id: objectID, git }));

const Results = () => (
  <Container>
    <ResultInfo />

    <Margin bottom={2}>
      <Hits
        hitComponent={({ hit }) => (
          <SandboxCard
            selectSandbox={() => selectSandbox(hit)}
            noHeight
            sandbox={{
              ...hit,
              title: getSandboxName({
                id: hit.objectID,
                alias: hit.alias,
                git: hit.git,
                title: hit.title,
              }),
              id: hit.objectID,
            }}
          />
        )}
      />
    </Margin>

    <Centered horizontal>
      <Pagination />
    </Centered>
  </Container>
);

export default Results;
