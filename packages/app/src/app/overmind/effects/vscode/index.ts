import DEFAULT_PRETTIER_CONFIG from '@codesandbox/common/lib/prettify-default-config';
import { resolveModule } from '@codesandbox/common/lib/sandbox/modules';
import { IReaction, json } from 'overmind';
import getTemplate from '@codesandbox/common/lib/templates';
import {
  CurrentUser,
  EditorSelection,
  Module,
  ModuleCorrection,
  ModuleError,
  Sandbox,
  SandboxFs,
  Settings,
  UserViewRange,
} from '@codesandbox/common/lib/types';
import { notificationState } from '@codesandbox/common/lib/utils/notifications';
import { hasPermission } from '@codesandbox/common/lib/utils/permission';
import {
  NotificationMessage,
  NotificationStatus,
} from '@codesandbox/notifications/lib/state';
import { CodeReferenceMetadata } from 'app/graphql/types';
import { Context } from 'app/overmind';
import { indexToLineAndColumn } from 'app/overmind/utils/common';
import prettify from 'app/src/app/utils/prettify';
import { blocker } from 'app/utils/blocker';
import { listen } from 'codesandbox-api';
import { debounce } from 'lodash-es';
import * as childProcess from 'node-services/lib/child_process';
import { TextOperation } from 'ot';

import FontFaceObserver from 'fontfaceobserver';
import io from 'socket.io-client';

import { EXTENSIONS_LOCATION, VIM_EXTENSION_ID } from './constants';
import {
  initializeCodeSandboxTheme,
  initializeCustomTheme,
  initializeExtensionsFolder,
  initializeSettings,
  initializeSnippetDirectory,
  initializeThemeCache,
} from './initializers';
import { Linter } from './Linter';
import {
  ModelsHandler,
  OnFileChangeData,
  OnOperationAppliedData,
  onSelectionChangeData,
} from './ModelsHandler';
import SandboxFsSync from './SandboxFsSync';
import { getSelection } from './utils';
import loadScript from './vscode-script-loader';
import { Workbench } from './Workbench';
import { composeMenuAppTree, MenuAppItems } from './composeMenuAppTree';

export type VsCodeOptions = {
  getCurrentSandbox: () => Sandbox | null;
  getCurrentModule: () => Module | null;
  getSandboxFs: () => SandboxFs;
  getCurrentUser: () => CurrentUser | null;
  onCodeChange: (data: OnFileChangeData) => void;
  onOperationApplied: (data: OnOperationAppliedData) => void;
  onSelectionChanged: (selection: onSelectionChangeData) => void;
  onViewRangeChanged: (viewRange: UserViewRange) => void;
  onCommentClick: (payload: {
    commentIds: string[];
    bounds: {
      left: number;
      top: number;
      bottom: number;
      right: number;
    };
  }) => void;
  reaction: IReaction<Context>;
  // These two should be removed
  getSignal: any;
  getState: any;
};

declare global {
  interface Window {
    CSEditor: any;
    monaco: any;
  }
}

/**
 * Responsible for rendering React components for files that are supported
 */
export interface ICustomEditorApi {
  getCustomEditor(
    modulePath: string
  ): false | ((container: HTMLElement, extraProps: object) => void) | null;
}

const context: any = window;

/**
 * Handles the VSCode instance for the whole app. The goal is to deprecate/remove this service at one point
 * and let the VSCode codebase handle the initialization of all elements. We are going for a gradual approach though,
 * that's why in the first phase we let the CodeSandbox application handle all the initialization of the VSCode
 * parts.
 */
export class VSCodeEffect {
  public initialized: Promise<unknown>;
  public sandboxFsSync: SandboxFsSync;
  private mountableFilesystem: any;

  private monaco: any;
  private editorApi: any;
  private clientExtensionHost: any;
  private containerExtensionHost: any;
  private options: VsCodeOptions;
  private controller: any;
  private commandService = blocker<any>();
  private extensionService = blocker<any>();
  private extensionEnablementService = blocker<any>();
  private workbench: Workbench;
  private settings: Settings;
  private linter: Linter | null;
  private modelsHandler: ModelsHandler;
  private modelSelectionListener: { dispose: Function };
  private modelCursorPositionListener: { dispose: Function };
  private modelViewRangeListener: { dispose: Function };
  private readOnly: boolean;
  private elements = {
    editor: document.createElement('div'),
    editorPart: document.createElement('div'),
    statusbar: document.createElement('div'),
  };

  private menuAppItems: MenuAppItems = [];

  private customEditorApi: ICustomEditorApi = {
    getCustomEditor: () => null,
  };

  onSelectionChangeDebounced: VsCodeOptions['onSelectionChanged'] & {
    cancel(): void;
  };

  /**
   * Look up the preferred (last defined) keybinding for a command.
   * @returns {ResolvedKeybinding} The preferred keybinding or null if the command is not bound.
   */
  public lookupKeybinding: (
    commandId: string
  ) => { getLabel(): string | null } | null;

  /**
   * Extract `contextMatchesRules` method from ContextKeyService
   * to match rules and conditionals in the editor
   */
  public contextMatchesRules: (rules: any | undefined) => boolean;

  public initialize(options: VsCodeOptions) {
    this.options = options;
    this.controller = {
      getState: options.getState,
      getSignal: options.getSignal,
    };
    this.onSelectionChangeDebounced = debounce(options.onSelectionChanged, 200);

    this.prepareElements();

    this.options.reaction(
      state => ({
        fileComments: json(state.comments.fileComments),
        currentCommentId: state.comments.currentCommentId,
      }),
      ({ fileComments, currentCommentId }) => {
        if (this.modelsHandler) {
          this.modelsHandler.applyComments(fileComments, currentCommentId);
        }
      }
    );
    this.listenToCommentClick();

    // We instantly create a sandbox sync, as we want our
    // extension host to get its messages handled to initialize
    // correctly
    this.sandboxFsSync = new SandboxFsSync({
      getSandboxFs: () => ({}),
      getCurrentSandbox: () => null,
    });

    import(
      // @ts-ignore
      'worker-loader?publicPath=/&name=client-ext-host-worker.[hash:8].worker.js!./extensionHostWorker/bootstrappers/client-ext-host'
    ).then(ExtHostWorkerLoader => {
      this.clientExtensionHost = ExtHostWorkerLoader.default;
    });

    import(
      // @ts-ignore
      'worker-loader?publicPath=/&name=container-ext-host-worker.[hash:8].worker.js!./extensionHostWorker/bootstrappers/container-ext-host'
    ).then(ExtHostWorkerLoader => {
      this.containerExtensionHost = ExtHostWorkerLoader.default;
    });

    this.initialized = this.initializeFileSystem().then(mfs => {
      this.mountableFilesystem = mfs;
      // We want to initialize before VSCode, but after browserFS is configured
      // For first-timers initialize a theme in the cache so it doesn't jump colors
      initializeExtensionsFolder();
      initializeCodeSandboxTheme();
      initializeCustomTheme();
      initializeThemeCache();
      initializeSettings();
      initializeSnippetDirectory();

      this.setVimExtensionEnabled(
        localStorage.getItem('settings.vimmode') === 'true'
      );

      return new FontFaceObserver('MonoLisa').load();
    });

    // Only set the read only state when the editor is initialized.
    this.initialized.then(() => {
      // ReadOnly mode is derivative, it's based on a couple conditions, of which the
      // most important one is Live. If you're in a classroom live session as spectator,
      // you should not be allowed to edit.
      options.reaction(
        state =>
          (state.editor.currentSandbox &&
            Boolean(state.editor.currentSandbox.git)) ||
          !state.live.isLive ||
          state.live.roomInfo?.mode === 'open' ||
          (state.live.roomInfo?.mode === 'classroom' &&
            state.live.isCurrentEditor),
        canEdit => {
          this.setReadOnly(!canEdit);
        }
      );
    });

    return this.initialized;
  }

  public isModuleOpened(module: Module) {
    return this.modelsHandler.isModuleOpened(module);
  }

  public async getCodeReferenceBoundary(
    commentId: string,
    reference: CodeReferenceMetadata
  ) {
    this.revealPositionInCenterIfOutsideViewport(reference.anchor, 1);

    return new Promise<DOMRect>((resolve, reject) => {
      let checkCount = 0;
      function findActiveComment() {
        checkCount++;

        if (checkCount === 20) {
          reject(new Error('Could not find the comment glyph'));
          return;
        }

        setTimeout(() => {
          const commentGlyphs = document.querySelectorAll(
            '.editor-comments-glyph'
          );
          const el = Array.from(commentGlyphs).find(glyphEl =>
            glyphEl.className.includes(commentId)
          );

          if (el) {
            resolve(el.getBoundingClientRect());
          } else {
            findActiveComment();
          }
        }, 10);
      }
      findActiveComment();
    });
  }

  public getEditorElement(
    getCustomEditor: ICustomEditorApi['getCustomEditor']
  ) {
    this.customEditorApi.getCustomEditor = getCustomEditor;
    return this.elements.editor;
  }

  public getMenuAppItems(): MenuAppItems {
    return this.menuAppItems;
  }

  public getStatusbarElement() {
    return this.elements.statusbar;
  }

  public runCommand = async (id: string, ...args: any[]) => {
    const commandService = await this.commandService.promise;

    return commandService.executeCommand(id, ...args);
  };

  public callCallbackError(id: string, message?: string) {
    // @ts-ignore
    if (window.cbs && window.cbs[id]) {
      const errorMessage =
        message || 'Something went wrong while saving the file.';
      // @ts-ignore
      window.cbs[id](new Error(errorMessage), undefined);
      // @ts-ignore
      delete window.cbs[id];
    }
  }

  public callCallback(id: string) {
    // @ts-ignore
    if (window.cbs && window.cbs[id]) {
      // @ts-ignore
      window.cbs[id](undefined, undefined);
      // @ts-ignore
      delete window.cbs[id];
    }
  }

  public setVimExtensionEnabled(enabled: boolean) {
    if (enabled) {
      this.enableExtension(VIM_EXTENSION_ID);
    } else {
      // Auto disable vim extension
      if (
        ([null, undefined] as Array<null | undefined | string>).includes(
          localStorage.getItem('vs-global://extensionsIdentifiers/disabled')
        )
      ) {
        localStorage.setItem(
          'vs-global://extensionsIdentifiers/disabled',
          '[{"id":"vscodevim.vim"}]'
        );
      }

      this.disableExtension(VIM_EXTENSION_ID);
    }
  }

  public syncModule(module: Module) {
    this.modelsHandler.syncModule(module);
  }

  public async applyOperation(moduleShortid: string, operation: TextOperation) {
    if (!this.modelsHandler) {
      return;
    }

    await this.modelsHandler.applyOperation(moduleShortid, operation);
  }

  public updateOptions(options: { readOnly: boolean }) {
    if (this.editorApi) {
      const editor = this.editorApi.getActiveCodeEditor();

      if (editor) {
        editor.updateOptions(options);
      }
    }
  }

  public clearUserSelections(userId: string) {
    if (!this.modelsHandler) {
      return;
    }

    this.modelsHandler.clearUserSelections(userId);
  }

  public updateUserSelections(
    module: Module,
    userSelections: EditorSelection[]
  ) {
    if (!this.modelsHandler) {
      return;
    }

    this.modelsHandler.updateUserSelections(module, userSelections);
  }

  public setReadOnly(enabled: boolean) {
    this.readOnly = enabled;
    this.updateOptions({ readOnly: enabled });
  }

  public updateLayout = (width: number, height: number) => {
    if (this.editorApi) {
      this.editorApi.editorPart.layout(width, height);
    }
  };

  public resetLayout() {
    if (this.editorApi) {
      // We have to wait for the layout to actually update in the DOM
      requestAnimationFrame(() => {
        const rootEl = document.querySelector('#vscode-container');
        if (rootEl) {
          const boundingRect = rootEl.getBoundingClientRect();

          this.editorApi.editorPart.layout(
            boundingRect.width,
            boundingRect.height
          );
        }
      });
    }
  }

  /*
    We need to use a callback to set the sandbox-fs into the state of Overmind. The reason
    is that we internally read from this state to get information about the files. It is really
    messy, but we will move to a completely internal filesystem soon
  */
  public async changeSandbox(sandbox: Sandbox, setFs: (fs: SandboxFs) => void) {
    await this.initialized;

    const isFirstLoad = !this.modelsHandler;

    const { isServer } = getTemplate(sandbox.template);

    try {
      this.mountableFilesystem.umount('/root/.cache');
    } catch {
      //
    }
    try {
      this.mountableFilesystem.umount('/sandbox/node_modules');
    } catch {
      //
    }
    try {
      // After navigation, this mount is already mounted and throws error,
      // which cause that Phonenix is not reconnected, so the file's content cannot be seen
      // https://github.com/codesandbox/codesandbox-client/issues/4143
      this.mountableFilesystem.umount('/home/sandbox/.cache');
    } catch {
      //
    }

    if (isServer && this.options.getCurrentUser()?.experiments.containerLsp) {
      childProcess.addDefaultForkHandler(this.createContainerForkHandler());
      const socket = this.createWebsocketFSRequest();
      const cache = await this.createFileSystem('WebsocketFS', {
        socket,
      });
      const nodeModules = await this.createFileSystem('WebsocketFS', {
        socket,
      });

      this.mountableFilesystem.mount('/home/sandbox/.cache', cache);
      this.mountableFilesystem.mount('/sandbox/node_modules', nodeModules);
    } else {
      childProcess.addDefaultForkHandler(this.clientExtensionHost);
      const nodeModules = await this.createFileSystem('CodeSandboxFS', {
        manager: {
          getTranspiledModules: () => this.sandboxFsSync.getTypes(),
          addModule() {},
          removeModule() {},
          moveModule() {},
          updateModule() {},
        },
      });
      this.mountableFilesystem.mount('/sandbox/node_modules', nodeModules);
    }

    if (isFirstLoad) {
      const container = this.elements.editor;

      await new Promise<void>(resolve => {
        loadScript(true, ['vs/editor/codesandbox.editor.main'])(resolve);
      }).then(() => this.loadEditor(window.monaco, container));
    }

    if (!isFirstLoad) {
      this.modelsHandler.dispose();
      this.sandboxFsSync.dispose();
    }

    this.modelsHandler = new ModelsHandler(
      this.editorApi,
      this.monaco,
      sandbox,
      this.onFileChange,
      this.onOperationApplied
    );
    this.sandboxFsSync = new SandboxFsSync(this.options);

    setFs(this.sandboxFsSync.create(sandbox));

    if (isFirstLoad) {
      this.sandboxFsSync.sync(() => {});
    } else {
      this.editorApi.extensionService.stopExtensionHost();
      this.sandboxFsSync.sync(() => {
        this.editorApi.extensionService.startExtensionHost();
      });
    }
  }

  public setModuleCode(module: Module, triggerChangeEvent = false) {
    if (!this.modelsHandler) {
      return;
    }

    this.modelsHandler.setModuleCode(module, triggerChangeEvent);
  }

  public async closeAllTabs() {
    if (this.editorApi) {
      const groupsToClose = this.editorApi.editorService.editorGroupService.getGroups();

      await Promise.all(
        groupsToClose.map(group =>
          Promise.all([
            group.closeAllEditors(),
            this.editorApi.editorService.editorGroupService.removeGroup(group),
          ])
        )
      );
    }
  }

  public async updateTabsPath(oldPath: string, newPath: string) {
    return this.modelsHandler.updateTabsPath(oldPath, newPath);
  }

  public async openModule(module: Module) {
    await this.initialized;

    // We use an animation frame here, because we want the rest of the logic to finish running,
    // allowing for a paint, like selections in explorer. For this to work we have to ensure
    // that we are actually indeed still trying to open this file, as we might have changed
    // the file
    return new Promise<void>(resolve => {
      requestAnimationFrame(async () => {
        const currentModule = this.options.getCurrentModule();
        if (currentModule && module.id === currentModule.id) {
          try {
            const model = await this.modelsHandler.changeModule(module);
            this.lint(module.title, model);
            resolve();
          } catch (error) {
            // We might try to open a module that is not actually opened in the editor,
            // but the configuration wizard.. currently this throws an error as there
            // is really no good way to identify when it happen. This needs to be
            // improved in next version
          }
        }
      });
    });
  }

  public setErrors = (errors: ModuleError[]) => {
    const activeEditor = this.editorApi.getActiveCodeEditor();

    if (activeEditor) {
      if (errors.length > 0) {
        const currentPath = this.getCurrentModelPath();
        const thisModuleErrors = errors.filter(
          error => error.path === currentPath
        );
        const errorMarkers = thisModuleErrors
          .map(error => {
            if (error) {
              return {
                severity: this.monaco.MarkerSeverity.Error,
                startColumn: 1,
                startLineNumber: error.line,
                endColumn: error.column,
                endLineNumber: error.line + 1,
                message: error.message,
              };
            }

            return null;
          })
          .filter(x => x);

        this.monaco.editor.setModelMarkers(
          activeEditor.getModel(),
          'error',
          errorMarkers
        );
      } else {
        this.monaco.editor.setModelMarkers(
          activeEditor.getModel(),
          'error',
          []
        );
      }
    }
  };

  public async openDiff(sandboxId: string, module: Module, oldCode: string) {
    if (!module.path) {
      return;
    }

    const recoverPath = `/recover/${sandboxId}/recover-${module.path.replace(
      /\//g,
      ' '
    )}`;
    const filePath = `/sandbox${module.path}`;
    const fileSystem = window.BrowserFS.BFSRequire('fs');

    // We have to write a recover file to the filesystem, we save it behind
    // the sandboxId
    if (!fileSystem.existsSync(`/recover/${sandboxId}`)) {
      fileSystem.mkdirSync(`/recover/${sandboxId}`);
    }
    // We write the recover file with the old code, as the new code is already applied
    fileSystem.writeFileSync(recoverPath, oldCode);

    // We open a conflict resolution editor for the files
    this.editorApi.editorService.openEditor({
      leftResource: this.monaco.Uri.from({
        scheme: 'conflictResolution',
        path: recoverPath,
      }),
      rightResource: this.monaco.Uri.file(filePath),
      label: `Recover - ${module.path}`,
      options: {
        pinned: true,
      },
    });
  }

  public clearComments() {
    this.modelsHandler.clearComments();
  }

  public setCorrections = (corrections: ModuleCorrection[]) => {
    const activeEditor = this.editorApi.getActiveCodeEditor();
    if (activeEditor) {
      if (corrections.length > 0) {
        const currentPath = this.getCurrentModelPath();
        const correctionMarkers = corrections
          .filter(correction => correction.path === currentPath)
          .map(correction => {
            if (correction) {
              return {
                severity:
                  correction.severity === 'warning'
                    ? this.monaco.MarkerSeverity.Warning
                    : this.monaco.MarkerSeverity.Notice,
                startColumn: correction.column,
                startLineNumber: correction.line,
                endColumn: correction.columnEnd || 1,
                endLineNumber: correction.lineEnd || correction.line + 1,
                message: correction.message,
                source: correction.source,
              };
            }

            return null;
          })
          .filter(x => x);

        this.monaco.editor.setModelMarkers(
          activeEditor.getModel(),
          'correction',
          correctionMarkers
        );
      } else {
        this.monaco.editor.setModelMarkers(
          activeEditor.getModel(),
          'correction',
          []
        );
      }
    }
  };

  /**
   * Reveal position in editor
   * @param scrollType 0 = smooth, 1 = immediate
   */
  revealPositionInCenterIfOutsideViewport(pos: number, scrollType: 0 | 1 = 0) {
    const activeEditor = this.editorApi.getActiveCodeEditor();

    if (activeEditor) {
      const model = activeEditor.getModel();

      if (model) {
        const lineColumnPos = indexToLineAndColumn(
          model.getLinesContent() || [],
          pos
        );

        activeEditor.revealPositionInCenterIfOutsideViewport(
          lineColumnPos,
          scrollType
        );
      }
    }
  }

  /**
   * Reveal line in editor
   * @param scrollType 0 = smooth, 1 = immediate
   */
  revealLine(lineNumber: number, scrollType: 0 | 1 = 0) {
    const activeEditor = this.editorApi.getActiveCodeEditor();

    if (activeEditor) {
      activeEditor.revealLine(lineNumber, scrollType);
    }
  }

  /**
   * Reveal revealLine in editor
   * @param scrollType 0 = smooth, 1 = immediate
   */
  revealRange(range: UserViewRange, scrollType: 0 | 1 = 0) {
    const activeEditor = this.editorApi.getActiveCodeEditor();

    if (activeEditor) {
      activeEditor.revealRange(range, scrollType);
    }
  }

  /**
   * Set the selection inside the editor
   * @param head Start of the selection
   * @param anchor End of the selection
   */
  setSelection(head: number, anchor: number) {
    const activeEditor = this.editorApi.getActiveCodeEditor();
    if (!activeEditor) {
      return;
    }

    const model = activeEditor.getModel();
    if (!model) {
      return;
    }

    const headPos = indexToLineAndColumn(model.getLinesContent() || [], head);
    const anchorPos = indexToLineAndColumn(
      model.getLinesContent() || [],
      anchor
    );
    const range = new this.monaco.Range(
      headPos.lineNumber,
      headPos.column,
      anchorPos.lineNumber,
      anchorPos.column
    );

    this.revealRange(range);
    activeEditor.setSelection(range);
  }

  // Communicates the endpoint for the WebsocketLSP
  private createContainerForkHandler() {
    return () => {
      const host = this.containerExtensionHost();
      host.addEventListener('message', event => {
        if (event.data.$type === 'request_lsp_endpoint') {
          event.target.postMessage({
            $type: 'respond_lsp_endpoint',
            $data: this.getLspEndpoint(),
          });
        }
      });
      return host;
    };
  }

  private getLspEndpoint() {
    // return 'ws://localhost:1023';
    // TODO: merge host logic with executor-manager
    const sseHost = process.env.ENDPOINT || 'https://codesandbox.io';
    return sseHost.replace(
      'https://',
      `wss://${this.options.getCurrentSandbox()?.id}-lsp.sse.`
    );
  }

  private createFileSystem(type: string, options: any) {
    return new Promise((resolve, reject) => {
      window.BrowserFS.FileSystem[type].Create(options, (error, fs) => {
        if (error) {
          reject(error);
        } else {
          resolve(fs);
        }
      });
    });
  }

  private createWebsocketFSRequest() {
    const socket = io(`${this.getLspEndpoint()}?type=go-to-definition`);
    return {
      emit: (data, cb) => {
        socket.emit('go-to-definition', data, cb);
      },
      dispose: () => {
        socket.close();
      },
    };
  }

  private async disableExtension(id: string) {
    const extensionService = await this.extensionService.promise;
    const extensionEnablementService = await this.extensionEnablementService
      .promise;

    const extensionDescription = await extensionService.getExtension(id);

    if (extensionDescription) {
      const { toExtension } = context.require(
        'vs/workbench/services/extensions/common/extensions'
      );
      const extension = toExtension(extensionDescription);
      extensionEnablementService.setEnablement([extension], 0);
    }
  }

  private async initializeFileSystem() {
    const fileSystems = await Promise.all([
      this.createFileSystem('InMemory', {}),
      this.createFileSystem('CodeSandboxEditorFS', {
        api: {
          getSandboxFs: this.options.getSandboxFs,
          getJwt: () => this.options.getState().jwt,
        },
      }),
      this.createFileSystem('LocalStorage', {}),
      this.createFileSystem('LocalStorage', {}),
      Promise.resolve().then(() =>
        Promise.all([
          this.createFileSystem('InMemory', {}),
          this.createFileSystem('BundledHTTPRequest', {
            index: EXTENSIONS_LOCATION + '/extensions/index.json',
            baseUrl: EXTENSIONS_LOCATION + '/extensions',
            bundle: EXTENSIONS_LOCATION + '/bundles/main.min.json',
            logReads: process.env.NODE_ENV === 'development',
          }),
        ]).then(([writableExtensions, readableExtensions]) =>
          this.createFileSystem('OverlayFS', {
            writable: writableExtensions,
            readable: readableExtensions,
          })
        )
      ),
      this.createFileSystem('InMemory', {}),
      this.createFileSystem('InMemory', {}),
    ]);

    const [
      root,
      sandbox,
      vscode,
      home,
      extensions,
      customTheme,
      recover,
    ] = fileSystems;

    const mfs = (await this.createFileSystem('MountableFileSystem', {
      '/': root,
      '/sandbox': sandbox,
      '/vscode': vscode,
      '/home': home,
      '/extensions': extensions,
      '/extensions/custom-theme': customTheme,
      '/recover': recover,
    })) as any;

    window.BrowserFS.initialize(mfs);

    return mfs;
  }

  private initializeReactions() {
    const { reaction } = this.options;

    reaction(state => state.preferences.settings, this.changeSettings, {
      nested: true,
      immediate: true,
    });
  }

  private async enableExtension(id: string) {
    const extensionEnablementService = await this.extensionEnablementService
      .promise;
    const extensionIdentifier = (
      await extensionEnablementService.getDisabledExtensions()
    ).find(ext => ext.id === id);

    if (extensionIdentifier) {
      // Sadly we have to call a private api for this. Might change this once we have extension management
      // built in.
      extensionEnablementService._enableExtension(extensionIdentifier);
    }
  }

  private async loadEditor(monaco: any, container: HTMLElement) {
    this.monaco = monaco;
    this.workbench = new Workbench(monaco, this.controller, this.runCommand);

    if (localStorage.getItem('settings.vimmode') === 'true') {
      this.enableExtension(VIM_EXTENSION_ID);
    }

    this.workbench.addWorkbenchActions();

    const r = window.require;
    const [
      { IEditorService },
      { ICodeEditorService },
      { ITextFileService },
      { ILifecycleService },
      { IEditorGroupsService },
      { IStatusbarService },
      { IExtensionService },
      { CodeSandboxService },
      { CodeSandboxConfigurationUIService },
      { ICodeSandboxEditorConnectorService },
      { ICommandService },
      { SyncDescriptor },
      { IInstantiationService },
      { IExtensionEnablementService },
      { IContextViewService },
      { MenuRegistry },
      { IKeybindingService },
      { IContextKeyService },
    ] = [
      r('vs/workbench/services/editor/common/editorService'),
      r('vs/editor/browser/services/codeEditorService'),
      r('vs/workbench/services/textfile/common/textfiles'),
      r('vs/platform/lifecycle/common/lifecycle'),
      r('vs/workbench/services/editor/common/editorGroupsService'),
      r('vs/platform/statusbar/common/statusbar'),
      r('vs/workbench/services/extensions/common/extensions'),
      r('vs/codesandbox/services/codesandbox/browser/codesandboxService'),
      r('vs/codesandbox/services/codesandbox/configurationUIService'),
      r(
        'vs/codesandbox/services/codesandbox/common/codesandboxEditorConnector'
      ),
      r('vs/platform/commands/common/commands'),
      r('vs/platform/instantiation/common/descriptors'),
      r('vs/platform/instantiation/common/instantiation'),
      r('vs/platform/extensionManagement/common/extensionManagement'),
      r('vs/platform/contextview/browser/contextView'),
      r('vs/platform/actions/common/actions'),
      r('vs/platform/keybinding/common/keybinding'),
      r('vs/platform/contextkey/common/contextkey'),
    ];

    const { serviceCollection } = await new Promise<any>(resolve => {
      monaco.editor.create(
        container,
        {
          codesandboxService: i =>
            new SyncDescriptor(CodeSandboxService, [this.controller, this]),
          codesandboxConfigurationUIService: i =>
            new SyncDescriptor(CodeSandboxConfigurationUIService, [
              this.customEditorApi,
            ]),
        },
        resolve
      );
    });

    return new Promise<void>(resolve => {
      // It has to run the accessor within the callback
      serviceCollection.get(IInstantiationService).invokeFunction(accessor => {
        // Initialize these services
        accessor.get(CodeSandboxConfigurationUIService);
        accessor.get(ICodeSandboxEditorConnectorService);

        const statusbarPart = accessor.get(IStatusbarService);
        const commandService = accessor.get(ICommandService);
        const extensionService = accessor.get(IExtensionService);
        const extensionEnablementService = accessor.get(
          IExtensionEnablementService
        );
        const keybindingService = accessor.get(IKeybindingService);
        const contextKeyService = accessor.get(IContextKeyService);

        this.lookupKeybinding = id => keybindingService.lookupKeybinding(id);
        this.contextMatchesRules = rules =>
          contextKeyService.contextMatchesRules(rules);
        this.commandService.resolve(commandService);
        this.extensionService.resolve(extensionService);
        this.extensionEnablementService.resolve(extensionEnablementService);

        const editorPart = accessor.get(IEditorGroupsService);
        const codeEditorService = accessor.get(ICodeEditorService);
        const textFileService = accessor.get(ITextFileService);
        const editorService = accessor.get(IEditorService);
        const contextViewService = accessor.get(IContextViewService);

        contextViewService.setContainer(container);

        this.editorApi = {
          openFile(path) {
            return codeEditorService.openCodeEditor({
              resource: monaco.Uri.file('/sandbox' + path),
            });
          },
          getActiveCodeEditor() {
            return codeEditorService.getActiveCodeEditor();
          },
          textFileService,
          editorPart,
          editorService,
          codeEditorService,
          extensionService,
        };

        window.CSEditor = {
          editor: this.editorApi,
          monaco,
        };

        statusbarPart.create(this.elements.statusbar);
        editorPart.create(this.elements.editorPart);
        editorPart.layout(container.offsetWidth, container.offsetHeight);

        this.menuAppItems = composeMenuAppTree(id =>
          MenuRegistry.getMenuItems(id)
        );

        editorPart.parent = container;

        container.appendChild(this.elements.editorPart);

        this.initializeReactions();

        this.configureMonacoLanguages(monaco);

        editorService.onDidActiveEditorChange(this.onActiveEditorChange);
        this.initializeCodeSandboxAPIListener();

        if (!this.linter && this.settings.lintEnabled) {
          this.createLinter();
        }

        const lifecycleService = accessor.get(ILifecycleService);

        // Trigger all VSCode lifecycle listeners
        lifecycleService.phase = 2; // Restoring
        requestAnimationFrame(() => {
          lifecycleService.phase = 3; // Running
        });

        resolve();
      });
    });
  }

  private _cachedDependencies = {};
  private _cachedDependenciesCode: string | undefined = undefined;
  private getDependencies(sandbox: Sandbox): { [depName: string]: string } {
    try {
      const module = resolveModule(
        '/package.json',
        sandbox.modules,
        sandbox.directories
      );
      if (this._cachedDependenciesCode !== module.code) {
        this._cachedDependenciesCode = module.code;
        const parsedPkg = JSON.parse(module.code);
        this._cachedDependencies = {
          ...(parsedPkg.dependencies || {}),
          ...(parsedPkg.devDependencies || {}),
        };
      }
    } catch (e) {
      /* ignore */
    }

    return this._cachedDependencies;
  }

  private prepareElements() {
    this.elements.editor.className = 'monaco-workbench';
    this.elements.editor.style.width = '100%';
    this.elements.editor.style.height = '100%';

    this.elements.statusbar.className = 'part statusbar';
    this.elements.statusbar.id = 'workbench.parts.statusbar';

    this.elements.editorPart.id = 'vscode-editor';
    this.elements.editorPart.className = 'part editor has-watermark';
    this.elements.editorPart.style.width = '100%';
    this.elements.editorPart.style.height = '100%';
  }

  private configureMonacoLanguages(monaco) {
    [
      'typescript',
      'typescriptreact',
      'javascript',
      'javascriptreact',
      'css',
      'less',
      'sass',
      'graphql',
      'html',
      'markdown',
      'json',
    ].forEach(language => {
      monaco.languages.registerDocumentFormattingEditProvider(language, {
        provideDocumentFormattingEdits: this.provideDocumentFormattingEdits,
      });
    });
  }

  private provideDocumentFormattingEdits = (model, _, token) =>
    prettify(
      model.uri.fsPath,
      () => model.getValue(),
      this.getPrettierConfig(),
      () => false,
      token
    ).then(newCode => [
      {
        range: model.getFullModelRange(),
        text: newCode,
      },
    ]);

  private changeSettings = (settings: Settings) => {
    this.settings = settings;

    if (!this.linter && this.settings.lintEnabled) {
      this.createLinter();
    } else if (this.linter && !this.settings.lintEnabled) {
      this.linter = this.linter.dispose();
    }
  };

  private createLinter() {
    this.linter = new Linter(this.editorApi, this.monaco);
  }

  private getPrettierConfig = () => {
    try {
      const sandbox = this.options.getCurrentSandbox();
      if (!sandbox) {
        return null;
      }
      const module = resolveModule(
        '/.prettierrc',
        sandbox.modules,
        sandbox.directories
      );

      return JSON.parse(module.code || '');
    } catch (e) {
      return this.settings.prettierConfig || DEFAULT_PRETTIER_CONFIG;
    }
  };

  private onOperationApplied = (data: OnOperationAppliedData) => {
    const currentModule = this.options.getCurrentModule();
    if (currentModule && data.moduleShortid === currentModule.shortid) {
      this.lint(data.title, data.model);
    }

    this.options.onOperationApplied(data);
  };

  private onFileChange = (data: OnFileChangeData) => {
    this.lint(data.title, data.model);
    this.options.onCodeChange(data);
  };

  public onFileDiff = (
    module: Module,
    original: { code: string; sha?: string },
    modified: { code: string; sha?: string }
  ) => {
    const { DiffComputer } = window.require(
      'vs/editor/common/diff/diffComputer'
    );

    const diff = new DiffComputer(
      original.code.split(/\n/),
      modified.code.split(/\n/),
      {
        shouldComputeCharChanges: true,
        shouldPostProcessCharChanges: true,
        shouldIgnoreTrimWhitespace: false,
        shouldMakePrettyDiff: true,
        maxComputationTime: 1000,
      }
    );
    const resultDiff = diff.computeDiff();

    if (
      resultDiff.length > 0 &&
      (original.sha !== modified.sha || original.code !== modified.code)
    ) {
      this.modelsHandler.applyLineChanges(module, resultDiff);
    } else {
      this.modelsHandler.cleanMarkDecoratorDiff(module);
    }
  };

  private onActiveEditorChange = () => {
    if (this.modelSelectionListener) {
      this.modelSelectionListener.dispose();
    }

    if (this.modelCursorPositionListener) {
      this.modelCursorPositionListener.dispose();
    }

    if (this.modelViewRangeListener) {
      this.modelViewRangeListener.dispose();
    }

    const activeEditor = this.editorApi.getActiveCodeEditor();

    if (activeEditor && activeEditor.getModel()) {
      const modulePath = activeEditor.getModel().uri.path;
      const currentModule = this.options.getCurrentModule();

      activeEditor.updateOptions({
        readOnly: this.readOnly || currentModule?.isBinary,
      });

      if (!modulePath.startsWith('/sandbox')) {
        return;
      }

      const sandbox = this.options.getCurrentSandbox();
      if (this.linter && sandbox) {
        this.linter.lint(
          activeEditor.getModel().getValue(),
          modulePath,
          activeEditor.getModel().getVersionId(),
          sandbox.template,
          this.getDependencies(sandbox)
        );
      }

      if (
        currentModule &&
        modulePath === `/sandbox${currentModule.path}` &&
        currentModule.code !== undefined &&
        activeEditor.getValue() !== currentModule.code &&
        !currentModule.isBinary
      ) {
        // This means that the file in Cerebral is dirty and has changed,
        // VSCode only gets saved contents. In this case we manually set the value correctly.

        this.modelsHandler.isApplyingOperation = true;
        const model = activeEditor.getModel();
        model.applyEdits([
          {
            text: currentModule.code,
            range: model.getFullModelRange(),
          },
        ]);
        this.modelsHandler.isApplyingOperation = false;
      }

      let lastViewRange = null;
      const isDifferentViewRange = (r1: UserViewRange, r2: UserViewRange) =>
        r1.startLineNumber !== r2.startLineNumber ||
        r1.startColumn !== r2.startColumn ||
        r1.endLineNumber !== r2.endLineNumber ||
        r1.endColumn !== r2.endColumn;

      this.modelViewRangeListener = activeEditor.onDidScrollChange(e => {
        const [range] = activeEditor.getVisibleRanges();

        if (
          lastViewRange == null ||
          (range && isDifferentViewRange(lastViewRange!, range))
        ) {
          lastViewRange = range;
          this.options.onViewRangeChanged(range);
        }
      });

      this.modelCursorPositionListener = activeEditor.onDidChangeCursorPosition(
        cursor => {
          if (
            sandbox &&
            sandbox.featureFlags.comments &&
            hasPermission(sandbox.authorization, 'comment')
          ) {
            const model = activeEditor.getModel();

            this.modelsHandler.updateLineCommentIndication(
              model,
              cursor.position.lineNumber
            );
          }
        }
      );

      this.modelSelectionListener = activeEditor.onDidChangeCursorSelection(
        selectionChange => {
          const model = activeEditor.getModel();
          const lines = model.getLinesContent() || [];
          const data: onSelectionChangeData = {
            primary: getSelection(lines, selectionChange.selection),
            secondary: selectionChange.secondarySelections.map(s =>
              getSelection(lines, s)
            ),
            source: selectionChange.source,
          };

          if (
            selectionChange.reason === 3 ||
            /* alt + shift + arrow keys */ selectionChange.source ===
              'moveWordCommand' ||
            /* click inside a selection */ selectionChange.source === 'api'
          ) {
            this.onSelectionChangeDebounced.cancel();
            this.options.onSelectionChanged(data);
          } else {
            // This is just on typing, we send a debounced selection update as a
            // safeguard to make sure we are in sync
            this.onSelectionChangeDebounced(data);
          }
        }
      );
    }
  };

  private initializeCodeSandboxAPIListener() {
    return listen(({ action, type, code, path, lineNumber, column }: any) => {
      if (type === 'add-extra-lib') {
        // TODO: bring this func back
        // const dtsPath = `${path}.d.ts`;
        // this.monaco.languages.typescript.typescriptDefaults._extraLibs[
        //   `file:///${dtsPath}`
        // ] = code;
        // this.commitLibChanges();
      } else if (action === 'editor.open-module') {
        const options: {
          selection?: { startLineNumber: number; startColumn: number };
        } = {};

        if (lineNumber || column) {
          options.selection = {
            startLineNumber: +lineNumber,
            startColumn: +(column || 0),
          };
        }

        this.editorApi.codeEditorService.openCodeEditor({
          resource: this.monaco.Uri.file('/sandbox' + path),
          options,
        });
      }
    });
  }

  private lint(title: string, model: any) {
    const sandbox = this.options.getCurrentSandbox();
    if (!sandbox || !this.linter) {
      return;
    }

    this.linter.lint(
      model.getValue(),
      title,
      model.getVersionId(),
      sandbox.template,
      this.getDependencies(sandbox)
    );
  }

  private getCurrentModelPath = () => {
    const activeEditor = this.editorApi.getActiveCodeEditor();

    if (!activeEditor) {
      return undefined;
    }
    const model = activeEditor.getModel();
    if (!model) {
      return undefined;
    }

    return model.uri.path.replace(/^\/sandbox/, '');
  };

  // This is used by the CodesandboxService internally
  private addNotification(
    message: string,
    type: 'error' | 'info' | 'warning' | 'success',
    options: { actions: NotificationMessage['actions']; sticky?: boolean }
  ) {
    const getStatus = () => {
      switch (type) {
        case 'error':
          return NotificationStatus.ERROR;
        case 'warning':
          return NotificationStatus.WARNING;
        case 'success':
          return NotificationStatus.SUCCESS;
        default:
          return NotificationStatus.NOTICE;
      }
    };

    notificationState.addNotification({
      message,
      status: getStatus(),
      sticky: options.sticky,
      actions: options.actions,
    });
  }

  private listenToCommentClick() {
    window.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('editor-comments-glyph')) {
        /*
          We grab the id of the commenthread by getting the last classname.
          The last part of the classname is the id.
        */
        const lastClass = Array.from(target.classList).pop();

        if (lastClass) {
          const commentIds = lastClass.startsWith('editor-comments-ids-')
            ? (lastClass.split('editor-comments-ids-').pop() || '').split('_')
            : [];
          const boundingRect = target.getBoundingClientRect();
          this.options.onCommentClick({
            commentIds,
            bounds: {
              left: boundingRect.left,
              top: boundingRect.top,
              right: boundingRect.right,
              bottom: boundingRect.bottom,
            },
          });
        }
      }
    });
  }
}

export default new VSCodeEffect();
