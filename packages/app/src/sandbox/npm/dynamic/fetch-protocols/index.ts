import { CSB_PKG_PROTOCOL } from '@codesandbox/common/lib/utils/ci';
import { CsbFetcher } from './csb';
import { UnpkgFetcher } from './unpkg';
import { JSDelivrNPMFetcher } from './jsdelivr/jsdelivr-npm';
import { JSDelivrGHFetcher } from './jsdelivr/jsdelivr-gh';
import { TarFetcher } from './tar';
import { FileFetcher } from './file';
import { GistFetcher } from './gist';
import { FetchProtocol } from '../fetch-npm-module';

let contributedProtocols: ProtocolDefinition[] = [];

const protocols: ProtocolDefinition[] = [
  {
    protocol: new GistFetcher(),
    condition: version => version.startsWith('gist:'),
  },
  {
    protocol: new CsbFetcher(),
    condition: version => CSB_PKG_PROTOCOL.test(version),
  },
  {
    protocol: new TarFetcher(),
    condition: version =>
      version.includes('http') && !version.includes('github.com'),
  },
  {
    protocol: new JSDelivrGHFetcher(),
    condition: version => /\//.test(version),
  },
  {
    protocol: new UnpkgFetcher(),
    condition: (version, useFallback) => useFallback,
  },
  { protocol: new JSDelivrNPMFetcher(), condition: () => true },
];

export type ProtocolDefinition = {
  protocol: FetchProtocol;
  condition: ProtocolCondition;
};

export type ProtocolCondition = (
  version: string,
  useFallback: boolean
) => boolean;

export function setContributedProtocols(protocols: ProtocolDefinition[]) {
  contributedProtocols = protocols;
}

export function getFetchProtocol(depVersion: string, useFallback = false) {
  const runCondition = (p: ProtocolDefinition) =>
    p.condition(depVersion, useFallback);

  return (
    contributedProtocols.find(runCondition)?.protocol ||
    protocols.find(runCondition)!.protocol
  );
}
