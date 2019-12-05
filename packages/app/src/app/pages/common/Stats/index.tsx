import React from 'react';
import { LikeHeart } from 'app/pages/common/LikeHeart';
import { Sandbox } from '@codesandbox/common/lib/types';
import { observer } from 'app/componentConnectors';

import { ForkIcon } from './ForkIcon';
import { EyeIcon } from './EyeIcon';

import { Stats as StatsWrapper } from './elements';
import { Stat } from './Stat';

interface Props {
  sandbox: Sandbox;
}

const StatsComponent = ({ sandbox }: Props) => (
  <StatsWrapper>
    <Stat
      Icon={<LikeHeart sandbox={sandbox} colorless />}
      count={sandbox.likeCount}
    />

    <Stat Icon={<EyeIcon />} count={sandbox.viewCount} />

    <Stat Icon={<ForkIcon />} count={sandbox.forkCount} />
  </StatsWrapper>
);

export const Stats = observer(StatsComponent);
