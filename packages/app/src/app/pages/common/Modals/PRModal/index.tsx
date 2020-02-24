import React, { FunctionComponent } from 'react';

import { GitProgress } from 'app/components/GitProgress';
import { useOvermind } from 'app/overmind';

import { ButtonContainer } from './elements';

export const PRModal: FunctionComponent = () => {
  const {
    state: {
      git: {
        isCreatingPr,
        pr: { prURL },
      },
    },
  } = useOvermind();

  return (
    <GitProgress
      message="Forking Repository & Creating PR..."
      result={
        isCreatingPr ? (
          <div>
            {`Done! We'll now open the new sandbox of this PR and GitHub in 3 seconds...`}

            <ButtonContainer>
              <a href={prURL} rel="noreferrer noopener" target="_blank">
                Click here if nothing happens.
              </a>
            </ButtonContainer>
          </div>
        ) : null
      }
    />
  );
};
