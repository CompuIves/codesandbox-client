import {
  Directory,
  LiveMessageEvent,
  Module,
  RoomInfo,
} from '@codesandbox/common/lib/types';
import { logBreadcrumb } from '@codesandbox/common/lib/utils/analytics/sentry';
import _debug from '@codesandbox/common/lib/utils/debug';
import { blocker } from 'app/utils/blocker';
import { camelizeKeys } from 'humps';
import { TextOperation } from 'ot';
import { Channel, Socket } from 'phoenix';
import uuid from 'uuid';

import { OPTIMISTIC_ID_PREFIX } from '../utils';
import clientsFactory from './clients';

type Options = {
  onApplyOperation(args: { moduleShortid: string; operation: any }): void;
  provideJwtToken(): string;
  getConnectionsCount: () => number;
};

type JoinChannelResponse = {
  liveUserId: string;
  roomInfo: RoomInfo;
};

declare global {
  interface Window {
    socket: any;
  }
}

const identifier = uuid.v4();
const sentMessages = new Map();
const debug = _debug('cs:socket');

let channel: Channel | null;
let messageIndex = 0;
let clients: ReturnType<typeof clientsFactory>;
let _socket: Socket;
let _getConnectionsCount: () => number;
let _currentFlushId: NodeJS.Timeout | null = null;
const _messageQueue: any[] = [];
let provideJwtToken: () => string;

export default new (class Live {
  initialize(options: Options) {
    const live = this;

    _getConnectionsCount = options.getConnectionsCount;
    clients = clientsFactory(
      (moduleShortid, revision, operation) => {
        logBreadcrumb({
          type: 'ot',
          message: `Sending ${JSON.stringify({
            moduleShortid,
            revision,
            operation,
          })}`,
        });

        return live.sendThrottledWhenSingleConnection('operation', {
          moduleShortid,
          operation,
          revision,
        });
      },
      (moduleShortid, operation) => {
        options.onApplyOperation({
          moduleShortid,
          operation,
        });
      }
    );
    provideJwtToken = options.provideJwtToken;
  }

  getSocket() {
    return _socket || this.connect();
  }

  connect(): Socket {
    if (!_socket) {
      const protocol = process.env.LOCAL_SERVER ? 'ws' : 'wss';
      _socket = new Socket(`${protocol}://${location.host}/socket`, {
        params: {
          guardian_token: provideJwtToken(),
        },
      });

      _socket.onClose(e => {
        if (e.code === 1006) {
          // This is an abrupt close, the server probably restarted or carshed. We don't want to overload
          // the server, so we manually wait and try to connect;
          _socket.disconnect();

          const waitTime = 500 + 5000 * Math.random();

          setTimeout(() => {
            _socket.connect();
          }, waitTime);
        }
      });

      _socket.connect();
      window.socket = _socket;
      debug('Connecting to socket', _socket);
    }

    return _socket;
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      if (!channel) {
        resolve({});
        return;
      }

      channel
        .leave()
        .receive('ok', resp => {
          if (!channel) {
            return resolve({});
          }

          channel.onMessage = d => d;
          channel = null;
          sentMessages.clear();
          messageIndex = 0;

          return resolve(resp);
        })
        // eslint-disable-next-line prefer-promise-reject-errors
        .receive('error', resp => reject(resp));
    });
  }

  joinChannel(roomId: string): Promise<JoinChannelResponse> {
    return new Promise((resolve, reject) => {
      channel = this.getSocket().channel(`live:${roomId}`, { version: 2 });

      channel
        .join()
        .receive('ok', resp => {
          const result = camelizeKeys(resp) as JoinChannelResponse;
          resolve(result);
        })
        .receive('error', resp => reject(camelizeKeys(resp)));
    });
  }

  // TODO: Need to take an action here
  listen(
    action: (payload: {
      event: LiveMessageEvent;
      _isOwnMessage: boolean;
      data: object;
    }) => {}
  ) {
    if (!channel) {
      return;
    }

    channel.onMessage = (event: any, data: any) => {
      const disconnected =
        (data == null || Object.keys(data).length === 0) &&
        event === 'phx_error';
      const alteredEvent = disconnected ? 'connection-loss' : event;

      const _isOwnMessage = Boolean(
        data && data._messageId && sentMessages.delete(data._messageId)
      );

      if (event === 'phx_reply' || event.startsWith('chan_reply_')) {
        // No action listens to this
        return data;
      }

      action({
        event: alteredEvent,
        _isOwnMessage,
        data: data == null ? {} : data,
      });

      return data;
    };
  }

  private sendMessage(event, payload) {
    const _messageId = identifier + messageIndex++;
    // eslint-disable-next-line
    payload._messageId = _messageId;
    sentMessages.set(_messageId, payload);

    return new Promise((resolve, reject) => {
      if (channel) {
        channel
          .push(event, payload)
          .receive('ok', resolve)
          .receive('error', reject);
      } else {
        // we might try to send messages even when not on live, just
        // ignore it
        resolve();
      }
    });
  }

  private flushMessages() {
    _messageQueue.forEach(send => send());
    _messageQueue.length = 0;
    clearTimeout(_currentFlushId);
    _currentFlushId = null;
  }

  sendWhenMultipleConnections(
    event: string,
    payload: { _messageId?: string; [key: string]: any }
  ) {
    if (_getConnectionsCount() < 2) {
      return Promise.resolve();
    }

    this.flushMessages();

    return this.sendMessage(event, payload);
  }

  sendThrottledWhenSingleConnection(
    event: string,
    payload: { _messageId?: string; [key: string]: any }
  ) {
    if (_getConnectionsCount() < 2) {
      const pendingMessage = blocker();

      _messageQueue.push(() => {
        pendingMessage.resolve(this.sendMessage(event, payload));
      });

      if (!_currentFlushId) {
        _currentFlushId = setTimeout(() => this.flushMessages(), 1000);
      }

      return pendingMessage.promise;
    }

    this.flushMessages();

    return this.sendMessage(event, payload);
  }

  sendModuleUpdate(module: Module) {
    return this.sendWhenMultipleConnections('module:updated', {
      type: 'module',
      moduleShortid: module.shortid,
      module,
    });
  }

  sendDirectoryUpdate(directory: Directory) {
    return this.sendWhenMultipleConnections('directory:updated', {
      type: 'directory',
      directoryShortid: directory.shortid,
      module: directory,
    });
  }

  sendCodeUpdate(moduleShortid: string, operation: any) {
    if (!operation) {
      return;
    }

    if (moduleShortid.startsWith(OPTIMISTIC_ID_PREFIX)) {
      // Module is an optimistic module, we will send a full code update
      // once the module has been created, until then, send nothing!
      return;
    }

    try {
      clients.get(moduleShortid).applyClient(operation);
    } catch (e) {
      // Something went wrong, probably a sync mismatch. Request new version
      this.sendWhenMultipleConnections('live:module_state', {});
    }
  }

  sendExternalResourcesChanged(externalResources: string[]) {
    return this.sendWhenMultipleConnections('sandbox:external-resources', {
      externalResources,
    });
  }

  sendUserCurrentModule(moduleShortid: string) {
    return this.sendWhenMultipleConnections('user:current-module', {
      moduleShortid,
    });
  }

  sendDirectoryCreated(directory: Directory) {
    return this.sendWhenMultipleConnections('directory:created', {
      type: 'directory',
      module: directory,
    });
  }

  sendDirectoryDeleted(directoryShortid: string) {
    this.sendWhenMultipleConnections('directory:deleted', {
      type: 'directory',
      directoryShortid,
    });
  }

  sendModuleCreated(module: Module) {
    return this.sendWhenMultipleConnections('module:created', {
      type: 'module',
      moduleShortid: module.shortid,
      module,
    });
  }

  sendModuleDeleted(moduleShortid: string) {
    return this.sendWhenMultipleConnections('module:deleted', {
      type: 'module',
      moduleShortid,
    });
  }

  sendMassCreatedModules(modules: Module[], directories: Directory[]) {
    return this.sendWhenMultipleConnections('module:mass-created', {
      directories,
      modules,
    });
  }

  sendLiveMode(mode: string) {
    return this.sendWhenMultipleConnections('live:mode', {
      mode,
    });
  }

  sendEditorAdded(liveUserId: string) {
    return this.sendWhenMultipleConnections('live:add-editor', {
      editor_user_id: liveUserId,
    });
  }

  sendEditorRemoved(liveUserId: string) {
    return this.sendWhenMultipleConnections('live:remove-editor', {
      editor_user_id: liveUserId,
    });
  }

  sendClosed() {
    return this.sendWhenMultipleConnections('live:close', {});
  }

  sendChat(message: string) {
    return this.sendWhenMultipleConnections('chat', {
      message,
    });
  }

  sendModuleSaved(module: Module) {
    return this.sendWhenMultipleConnections('module:saved', {
      type: 'module',
      module,
      moduleShortid: module.shortid,
    });
  }

  sendChatEnabled(enabled: boolean) {
    return this.sendWhenMultipleConnections('live:chat_enabled', { enabled });
  }

  sendModuleStateSyncRequest() {
    return this.sendWhenMultipleConnections('live:module_state', {});
  }

  sendUserSelection(
    moduleShortid: string | null,
    liveUserId: string,
    selection: any
  ) {
    return this.sendWhenMultipleConnections('user:selection', {
      liveUserId,
      moduleShortid,
      selection,
    });
  }

  getAllClients() {
    return clients.getAll();
  }

  applyClient(moduleShortid: string, operation: any) {
    return clients
      .get(moduleShortid)
      .applyClient(TextOperation.fromJSON(operation));
  }

  applyServer(moduleShortid: string, operation: any) {
    return clients
      .get(moduleShortid)
      .applyServer(TextOperation.fromJSON(operation));
  }

  serverAck(moduleShortid: string) {
    return clients.get(moduleShortid).serverAck();
  }

  createClient(moduleShortid: string, revision: number) {
    return clients.create(moduleShortid, revision);
  }

  resetClients() {
    clients.clear();
  }
})();
