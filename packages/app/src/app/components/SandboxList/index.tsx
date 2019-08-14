import * as React from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { sandboxUrl } from '@codesandbox/common/lib/utils/url-generator';
import getIcon from '@codesandbox/common/lib/templates/icons';
import { SmallSandbox } from '@codesandbox/common/lib/types';
import FullHeartIcon from 'react-icons/lib/fa/heart';
import EyeIcon from 'react-icons/lib/fa/eye';
import ForkIcon from 'react-icons/lib/go/repo-forked';
import DeleteSandboxButton from '../DeleteSandboxButton';
import PrivacyStatus from '../PrivacyStatus';
import {
  HeaderRow,
  HeaderTitle,
  Table,
  StatTitle,
  StatBody,
  DeleteBody,
  Body,
  SandboxRow,
} from './elements';

interface ISandboxListProps {
  sandboxes: SmallSandbox[];
  isCurrentUser: boolean;
  onDelete: () => void;
}

const SandboxList: React.FC<ISandboxListProps> = ({
  sandboxes,
  isCurrentUser,
  onDelete,
}) => (
  <Table>
    <thead>
      <HeaderRow>
        <HeaderTitle>Title</HeaderTitle>
        <HeaderTitle>Created</HeaderTitle>
        <HeaderTitle>Updated</HeaderTitle>
        <StatTitle />
        <StatTitle>
          <FullHeartIcon />
        </StatTitle>
        <StatTitle>
          <EyeIcon />
        </StatTitle>
        <StatTitle>
          <ForkIcon />
        </StatTitle>
        {isCurrentUser && <HeaderTitle />}
      </HeaderRow>
    </thead>
    <Body>
      {sandboxes.map((s, i) => {
        // TODO: investigate type mismatch between SmallSandbox and getIcon
        // @ts-ignore
        const Icon = getIcon(s.template);

        return (
          <SandboxRow delay={i} key={s.id}>
            <td>
              {/* We should probably use the Sandbox interface instead
                 * of SmallSandbox
                // @ts-ignore */}
              <Link to={sandboxUrl(s)}>{s.title || s.id}</Link>
              <PrivacyStatus privacy={s.privacy} asIcon />
            </td>
            <td>{moment(s.insertedAt).format('ll')}</td>
            <td>{moment(s.updatedAt).format('ll')}</td>
            <StatBody>
              <Icon width={30} height={30} />
            </StatBody>
            <StatBody>{s.likeCount}</StatBody>
            <StatBody>{s.viewCount}</StatBody>
            <StatBody>{s.forkCount}</StatBody>
            {isCurrentUser && (
              <DeleteBody>
                <DeleteSandboxButton id={s.id} onDelete={onDelete} />
              </DeleteBody>
            )}
          </SandboxRow>
        );
      })}
    </Body>
  </Table>
);

export default SandboxList;
