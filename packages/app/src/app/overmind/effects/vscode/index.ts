import DEFAULT_PRETTIER_CONFIG from '@codesandbox/common/lib/prettify-default-config';
import { resolveModule } from '@codesandbox/common/lib/sandbox/modules';
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
} from '@codesandbox/common/lib/types';
import { notificationState } from '@codesandbox/common/lib/utils/notifications';
import {
  NotificationMessage,
  NotificationStatus,
} from '@codesandbox/notifications/lib/state';
import { Reaction } from 'app/overmind';
import prettify from 'app/src/app/utils/prettify';
import { blocker } from 'app/utils/blocker';
import { listen } from 'codesandbox-api';
import FontFaceObserver from 'fontfaceobserver';
import { debounce } from 'lodash-es';
import * as childProcess from 'node-services/lib/child_process';
import io from 'socket.io-client';

import { EXTENSIONS_LOCATION, VIM_EXTENSION_ID } from './constants';
import {
  initializeCodeSandboxTheme,
  initializeCustomTheme,
  initializeExtensionsFolder,
  initializeSettings,
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

export type VsCodeOptions = {
  getCurrentSandbox: () => Sandbox | null;
  getCurrentModule: () => Module | null;
  getSandboxFs: () => SandboxFs;
  getCurrentUser: () => CurrentUser | null;
  onCodeChange: (data: OnFileChangeData) => void;
  onOperationApplied: (data: OnOperationAppliedData) => void;
  onSelectionChange: (selection: onSelectionChangeData) => void;
  reaction: Reaction;
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
  private readOnly: boolean;
  private elements = {
    editor: document.createElement('div'),
    editorPart: document.createElement('div'),
    menubar: document.createElement('div'),
    statusbar: document.createElement('div'),
  };

  private customEditorApi: ICustomEditorApi = {
    getCustomEditor: () => null,
  };

  onSelectionChangeDebounced: VsCodeOptions['onSelectionChange'] & {
    cancel(): void;
  };

  public initialize(options: VsCodeOptions) {
    this.options = options;
    this.controller = {
      getState: options.getState,
      getSignal: options.getSignal,
    };
    this.onSelectionChangeDebounced = debounce(options.onSelectionChange, 500);

    this.prepareElements();

    // We instantly create a sandbox sync, as we want our
    // extension host to get its messages handled to initialize
    // correctly
    this.sandboxFsSync = new SandboxFsSync({
      getSandboxFs: () => ({}),
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
      this.setVimExtensionEnabled(
        localStorage.getItem('settings.vimmode') === 'true'
      );

      return new FontFaceObserver('dm').load();
    });

    // Only set the read only state when the editor is initialized.
    this.initialized.then(() => {
      // ReadOnly mode is derivative, it's based on a couple conditions, of which the
      // most important one is Live. If you're in a classroom live session as spectator,
      // you should not be allowed to edit.
      options.reaction(
        state =>
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

  public getEditorElement(
    getCustomEditor: ICustomEditorApi['getCustomEditor']
  ) {
    this.customEditorApi.getCustomEditor = getCustomEditor;
    return this.elements.editor;
  }

  public getMenubarElement() {
    return this.elements.menubar;
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

  public revertModule(module: Module) {
    this.modelsHandler.revertModule(module);
  }

  public async applyOperation(
    moduleShortid: string,
    operation: (string | number)[]
  ) {
    if (!this.modelsHandler) {
      return;
    }

    await this.modelsHandler.applyOperation(moduleShortid, operation);
  }

  public updateOptions(options: { readOnly: boolean }) {
    const editor = this.editorApi.getActiveCodeEditor();

    if (editor) {
      editor.updateOptions(options);
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

      await new Promise(resolve => {
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

  public async setModuleCode(module: Module) {
    if (!this.modelsHandler) {
      return;
    }

    await this.modelsHandler.setModuleCode(module);
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
    requestAnimationFrame(async () => {
      const currentModule = this.options.getCurrentModule();
      if (currentModule && module.id === currentModule.id) {
        try {
          const model = await this.modelsHandler.changeModule(module);

          this.lint(module.title, model);
        } catch (error) {
          // We might try to open a module that is not actually opened in the editor,
          // but the configuration wizard.. currently this throws an error as there
          // is really no good way to identify when it happen. This needs to be
          // improved in next version
        }
      }
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
    const sseHost = process.env.STAGING_API
      ? 'https://codesandbox.stream'
      : 'https://codesandbox.io';
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
    ]);

    const [root, sandbox, vscode, home, extensions, customTheme] = fileSystems;

    const mfs = await this.createFileSystem('MountableFileSystem', {
      '/': root,
      '/sandbox': sandbox,
      '/vscode': vscode,
      '/home': home,
      '/extensions': extensions,
      '/extensions/custom-theme': customTheme,
    });

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
    ] = [
      r('vs/workbench/services/editor/common/editorService'),
      r('vs/editor/browser/services/codeEditorService'),
      r('vs/workbench/services/textfile/common/textfiles'),
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

    return new Promise(resolve => {
      // It has to run the accessor within the callback
      serviceCollection.get(IInstantiationService).invokeFunction(accessor => {
        // Initialize these services
        accessor.get(CodeSandboxConfigurationUIService);
        accessor.get(ICodeSandboxEditorConnectorService);

        const statusbarPart = accessor.get(IStatusbarService);
        const menubarPart = accessor.get('menubar');
        const commandService = accessor.get(ICommandService);
        const extensionService = accessor.get(IExtensionService);
        const extensionEnablementService = accessor.get(
          IExtensionEnablementService
        );

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

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line
          console.log(accessor);
        }

        statusbarPart.create(this.elements.statusbar);
        menubarPart.create(this.elements.menubar);
        editorPart.create(this.elements.editorPart);
        editorPart.layout(container.offsetWidth, container.offsetHeight);

        editorPart.parent = container;

        container.appendChild(this.elements.editorPart);

        this.initializeReactions();

        this.configureMonacoLanguages(monaco);

        editorService.onDidActiveEditorChange(this.onActiveEditorChange);
        this.initializeCodeSandboxAPIListener();

        if (this.settings.lintEnabled) {
          this.createLinter();
        }
        resolve();
      });
    });
  }

  private prepareElements() {
    this.elements.editor.className = 'monaco-workbench';
    this.elements.editor.style.width = '100%';
    this.elements.editor.style.height = '100%';

    this.elements.menubar.style.alignItems = 'center';
    this.elements.menubar.style.height = '38px';
    this.elements.menubar.style.fontSize = '0.8125rem';
    this.elements.menubar.className = 'menubar';

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

  private onActiveEditorChange = () => {
    if (this.modelSelectionListener) {
      this.modelSelectionListener.dispose();
    }

    const activeEditor = this.editorApi.getActiveCodeEditor();

    if (activeEditor && activeEditor.getModel()) {
      const modulePath = activeEditor.getModel().uri.path;

      activeEditor.updateOptions({ readOnly: this.readOnly });

      if (!modulePath.startsWith('/sandbox')) {
        return;
      }

      const sandbox = this.options.getCurrentSandbox();
      if (this.linter && sandbox) {
        this.linter.lint(
          activeEditor.getModel().getValue(),
          modulePath,
          activeEditor.getModel().getVersionId(),
          sandbox.template
        );
      }

      const currentModule = this.options.getCurrentModule();

      if (
        currentModule &&
        modulePath === `/sandbox${currentModule.path}` &&
        currentModule.code !== undefined &&
        activeEditor.getValue() !== currentModule.code
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

      this.modelSelectionListener = activeEditor.onDidChangeCursorSelection(
        selectionChange => {
          const lines = activeEditor.getModel().getLinesContent() || [];
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
            this.options.onSelectionChange(data);
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
            startLineNumber: lineNumber,
            startColumn: column || 0,
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
      sandbox.template
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
}

export default new VSCodeEffect();
