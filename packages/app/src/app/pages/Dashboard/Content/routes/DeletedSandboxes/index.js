import React from 'react';
import { Observer } from 'app/componentConnectors';
import Helmet from 'react-helmet';
import { Query } from 'react-apollo';
import RemoveIcon from 'react-icons/lib/md/highlight-remove';

import { Content as Sandboxes } from '../../Sandboxes';

import { DELETED_SANDBOXES_CONTENT_QUERY } from '../../../queries';
import { getPossibleTemplates } from '../../Sandboxes/utils';

const DeletedSandboxes = () => (
  <>
    <Helmet>
      <title>Deleted Sandboxes - CodeSandbox</title>
    </Helmet>
    <Query
      fetchPolicy="cache-and-network"
      query={DELETED_SANDBOXES_CONTENT_QUERY}
    >
      {({ loading, error, data }) => (
        <Observer>
          {({ store, signals }) => {
            if (error) {
              return <div>Error!</div>;
            }

            const sandboxes = loading
              ? []
              : (data && data.me && data.me.sandboxes) || [];

            const possibleTemplates = getPossibleTemplates(sandboxes);

            const orderedSandboxes = store.dashboard.getFilteredSandboxes(
              sandboxes
            );
            signals.dashboard.setTrashSandboxes({
              sandboxIds: orderedSandboxes.map(i => i.id),
            });

            return (
              <Sandboxes
                isLoading={loading}
                Header="Deleted Sandboxes"
                sandboxes={orderedSandboxes}
                possibleTemplates={possibleTemplates}
                actions={
                  orderedSandboxes.length
                    ? [
                        {
                          name: 'Empty Trash',
                          Icon: <RemoveIcon />,
                          run: () => {
                            signals.modalOpened({
                              modal: 'emptyTrash',
                            });
                          },
                        },
                      ]
                    : []
                }
              />
            );
          }}
        </Observer>
      )}
    </Query>
  </>
);

export default DeletedSandboxes;
