import { resolveModule } from '@codesandbox/common/lib/sandbox/modules';
import {
  EditorSelection,
  Module,
  Sandbox,
  UserSelection,
} from '@codesandbox/common/lib/types';
import { getTextOperation } from '@codesandbox/common/lib/utils/diff';
import { hasPermission } from '@codesandbox/common/lib/utils/permission';
import { indexToLineAndColumn } from 'app/overmind/utils/common';
import { actions, dispatch } from 'codesandbox-api';
import { css } from 'glamor';
import { TextOperation } from 'ot';

import { getCurrentModelPath } from './utils';

// @ts-ignore
const fadeIn = css.keyframes('fadeIn', {
  // optional name
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

// @ts-ignore
const fadeOut = css.keyframes('fadeOut', {
  // optional name
  '0%': { opacity: 1 },
  '100%': { opacity: 0 },
});

export type OnFileChangeData = {
  moduleShortid: string;
  title: string;
  code: string;
  event: any;
  model: any;
};

export type onSelectionChangeData = UserSelection;

export type OnOperationAppliedData = {
  moduleShortid: string;
  operation: TextOperation;
  title: string;
  code: string;
  model: any;
};

export type OnFileChangeCallback = (data: OnFileChangeData) => void;

export type OnOperationAppliedCallback = (data: OnOperationAppliedData) => void;

export type ModuleModel = {
  changeListener: { dispose: Function } | null;
  currentLine: number;
  path: string;
  model: null | any;
  comments: Array<{ commentId: string; range: [number, number] }>;
  currentCommentDecorations: string[];
};

export class ModelsHandler {
  public isApplyingOperation: boolean = false;
  private moduleModels: { [path: string]: ModuleModel } = {};
  private modelAddedListener: { dispose: Function };
  private modelRemovedListener: { dispose: Function };
  private onChangeCallback: OnFileChangeCallback;
  private onOperationAppliedCallback: OnOperationAppliedCallback;
  private sandbox: Sandbox;
  private editorApi;
  private monaco;
  private userClassesGenerated = {};
  private userSelectionDecorations = {};
  private currentCommentThreadId: string | null = null;
  constructor(
    editorApi,
    monaco,
    sandbox: Sandbox,
    onChangeCallback: OnFileChangeCallback,
    onOperationAppliedCallback: OnOperationAppliedCallback
  ) {
    this.editorApi = editorApi;
    this.monaco = monaco;
    this.sandbox = sandbox;
    this.onChangeCallback = onChangeCallback;
    this.onOperationAppliedCallback = onOperationAppliedCallback;
    this.listenForChanges();
  }

  public dispose(): null {
    this.modelAddedListener.dispose();
    this.modelRemovedListener.dispose();
    Object.keys(this.moduleModels).forEach(path => {
      const changeListener = this.moduleModels[path].changeListener;
      if (changeListener) {
        changeListener.dispose();
      }
    });
    this.moduleModels = {};

    return null;
  }

  public async syncModule(module: Module) {
    const fileModel = this.editorApi.textFileService
      .getFileModels()
      .find(
        fileModelItem =>
          fileModelItem.resource.path === '/sandbox' + module.path
      );

    if (fileModel) {
      this.isApplyingOperation = true;
      fileModel.revert();
      this.isApplyingOperation = false;
    }
  }

  private getModuleModelByPath(path: string): ModuleModel | undefined {
    const fullPath = '/sandbox' + path;

    return this.moduleModels[fullPath];
  }

  private getOrCreateModuleModelByPath(path: string): ModuleModel {
    const fullPath = '/sandbox' + path;
    this.moduleModels[fullPath] = this.getModuleModelByPath(path) || {
      changeListener: null,
      model: null,
      currentLine: 0,
      path: fullPath,
      comments: [],
      currentCommentDecorations: [],
    };

    return this.moduleModels[fullPath];
  }

  public updateLineCommentIndication(model: any, lineNumber: number) {
    const moduleModel = this.moduleModels[model.uri.path];

    moduleModel.currentLine = lineNumber;

    const newDecorationComments = this.createCommentDecorations(
      moduleModel.comments,
      model,
      this.currentCommentThreadId,
      moduleModel.currentLine
    );
    moduleModel.currentCommentDecorations = model.deltaDecorations(
      moduleModel.currentCommentDecorations,
      newDecorationComments
    );
  }

  public clearComments() {
    Object.values(this.moduleModels).forEach(moduleModel => {
      if (!moduleModel.model) {
        return;
      }
      moduleModel.comments = [];
      moduleModel.currentCommentDecorations = moduleModel.model.deltaDecorations(
        moduleModel.currentCommentDecorations,
        []
      );
    });
  }

  _decorations = [];

  public applyLineChanges(
    module: Module,
    position: {
      modifiedEndLineNumber: number;
      modifiedStartLineNumber: number;
      originalEndLineNumber: number;
      originalStartLineNumber: number;
      charChanges: [] | undefined;
    }[]
  ) {
    const moduleModel = this.getModuleModelByPath(module.path);
    if (!moduleModel?.model) return;
    const model = moduleModel.model;

    const markers = position.map(pos => {
      const isDeletion =
        pos.modifiedEndLineNumber !== pos.modifiedStartLineNumber &&
        pos.originalStartLineNumber === pos.originalEndLineNumber &&
        pos.originalEndLineNumber !== 0 &&
        pos.originalStartLineNumber !== 0 &&
        pos.charChanges === undefined;

      /**
       * Deletion
       */
      if (isDeletion) {
        const deletedPosition = pos.modifiedStartLineNumber + 1;

        return {
          range: new window.monaco.Range(
            deletedPosition,
            1,
            deletedPosition,
            1
          ),
          options: {
            isWholeLine: true,
            linesDecorationsClassName: 'editor--line editor--line_delete',
          },
        };
      }

      /**
       * Change
       */
      return {
        range: new window.monaco.Range(
          pos.modifiedStartLineNumber,
          1,
          pos.modifiedEndLineNumber,
          1
        ),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: 'editor--line editor--line_change',
        },
      };
    });

    this._decorations = model.deltaDecorations(this._decorations, markers);
  }

  public cleanMarkDecoratorDiff(module: Module) {
    const moduleModel = this.getModuleModelByPath(module.path);

    if (!moduleModel?.model) {
      return;
    }

    const model = moduleModel.model;

    this._decorations = model.deltaDecorations(this._decorations, []);
    document
      .querySelectorAll('.editor--line')
      .forEach(element => element.remove());
  }

  public isModuleOpened(module: Module) {
    const moduleModel = this.getModuleModelByPath(module.path);
    return Boolean(moduleModel?.model);
  }

  public changeModule = async (module: Module) => {
    const moduleModel = this.getOrCreateModuleModelByPath(module.path);

    if (getCurrentModelPath(this.editorApi) !== module.path) {
      await this.editorApi.openFile(module.path);
    }

    moduleModel.model = await this.editorApi.textFileService.models
      .loadOrCreate(this.monaco.Uri.file('/sandbox' + module.path))
      .then(textFileEditorModel => textFileEditorModel.load())
      .then(textFileEditorModel => textFileEditorModel.textEditorModel);

    const model = moduleModel.model;

    if (this.sandbox.featureFlags.comments) {
      const newDecorationComments = this.createCommentDecorations(
        moduleModel.comments,
        model,
        this.currentCommentThreadId,
        moduleModel.currentLine
      );
      moduleModel.currentCommentDecorations = model.deltaDecorations(
        moduleModel.currentCommentDecorations,
        newDecorationComments
      );
    }

    return moduleModel.model;
  };

  public async applyComments(
    commentThreadsByPath: {
      [path: string]: Array<{
        commentId: string;
        range: [number, number];
      }>;
    },
    currentCommentThreadId: string | null
  ) {
    // We keep a local reference to the current commentThread id,
    // because when opening modules we want to highlight any currently
    // selected comment
    this.currentCommentThreadId = currentCommentThreadId;

    // Ensure we have the moduleModels
    Object.keys(commentThreadsByPath).forEach(path => {
      this.getOrCreateModuleModelByPath(path).comments =
        commentThreadsByPath[path];
    });

    // Apply the decorations
    Object.keys(this.moduleModels).forEach(path => {
      const moduleModel = this.moduleModels[path];
      const model = moduleModel.model;

      if (!model) {
        return;
      }

      // Clean out any removed comments
      const currentCommentIds = (
        commentThreadsByPath[path.replace('/sandbox', '')] || []
      ).map(comment => comment.commentId);
      moduleModel.comments = moduleModel.comments.filter(comment =>
        currentCommentIds.includes(comment.commentId)
      );

      const existingDecorationComments = moduleModel.currentCommentDecorations;
      const newDecorationComments = this.createCommentDecorations(
        moduleModel.comments,
        model,
        currentCommentThreadId,
        moduleModel.currentLine
      );

      moduleModel.currentCommentDecorations = model.deltaDecorations(
        existingDecorationComments,
        newDecorationComments
      );
    });
  }

  public async updateTabsPath(oldPath: string, newPath: string) {
    const oldModelPath = '/sandbox' + oldPath;
    const newModelPath = '/sandbox' + newPath;

    return Promise.all(
      Object.keys(this.moduleModels).map(path => {
        if (oldModelPath === path && this.moduleModels[path].model) {
          const model = this.moduleModels[path].model;

          // This runs remove/add automatically
          return this.editorApi.textFileService.move(
            model.uri,
            this.monaco.Uri.file(newModelPath)
          );
        }

        return Promise.resolve();
      })
    );
  }

  public async applyOperation(moduleShortid: string, operation: TextOperation) {
    const module = this.sandbox.modules.find(m => m.shortid === moduleShortid);

    if (!module) {
      return;
    }

    const moduleModel = this.getOrCreateModuleModelByPath(module.path);

    const modelEditor = this.editorApi.editorService.editors.find(
      editor => editor.resource && editor.resource.path === moduleModel.path
    );

    // We keep a reference to the model on our own. We keep it as a
    // promise, because there might be multiple operations fired before
    // the model is actually resolved. This creates a "natural" queue
    if (!moduleModel.model) {
      if (modelEditor) {
        moduleModel.model = await modelEditor.textModelReference.then(
          ref => ref.object.textEditorModel
        );
      } else {
        moduleModel.model = await this.editorApi.textFileService.models
          .loadOrCreate(this.monaco.Uri.file(moduleModel.path))
          .then(model => model.textEditorModel);
      }
    }

    const model = moduleModel.model;

    this.isApplyingOperation = true;
    this.applyOperationToModel(operation, false, model);
    this.isApplyingOperation = false;
    this.onOperationAppliedCallback({
      code: model.getValue(),
      operation,
      moduleShortid: module.shortid,
      title: module.title,
      model,
    });
  }

  /**
   * Sets the code of a model in VSCode. This means that we directly change the in-memory
   * model and the user will immediately see the code.
   * @param module The module to apply the changes of
   * @param triggerChangeEvent Whether we should trigger this event to listeners listening to the model (for eg. live)
   */
  public setModuleCode(module: Module, triggerChangeEvent = false) {
    const moduleModel = this.getModuleModelByPath(module.path);
    const model = moduleModel?.model;

    if (!model) {
      return;
    }

    const oldCode = model.getValue();
    const changeOperation = getTextOperation(oldCode, module.code);
    if (!triggerChangeEvent) {
      this.isApplyingOperation = true;
    }
    this.applyOperationToModel(changeOperation, false, model);
    if (!triggerChangeEvent) {
      this.isApplyingOperation = false;
    }
  }

  public clearUserSelections(userId: string) {
    const decorations = Object.keys(this.userSelectionDecorations).filter(d =>
      d.startsWith(userId)
    );
    Object.keys(this.moduleModels).forEach(key => {
      const moduleModel = this.moduleModels[key];

      if (!moduleModel?.model) {
        return;
      }

      const model = moduleModel.model;

      decorations.forEach(decorationId => {
        const userDecorationIdPrefix = this.getSelectionDecorationId(
          userId,
          model.id
        );
        if (decorationId.startsWith(userDecorationIdPrefix)) {
          this.userSelectionDecorations[decorationId] = model.deltaDecorations(
            this.userSelectionDecorations[decorationId] || [],
            []
          );
        }
      });
    });
  }

  private getSelectionDecorationId = (
    userId: string,
    modelId: string = '',
    shortid: string = ''
  ) => [userId, modelId, shortid].join('|').replace(/\|\|$/, '|');

  private cleanUserSelections = (
    model: any,
    moduleShortid: string,
    userSelectionsToKeep: EditorSelection[]
  ) => {
    const existingSelectionDecorations = Object.keys(
      this.userSelectionDecorations
    ).filter(s => s.endsWith([model.id, moduleShortid].join('|')));

    const newUserSelections = {};
    for (let i = 0; i < userSelectionsToKeep.length; i++) {
      newUserSelections[userSelectionsToKeep[i].userId] =
        userSelectionsToKeep[i];
    }

    existingSelectionDecorations.forEach(existingDecorationId => {
      const userId = existingDecorationId.split('|')[0];
      if (!newUserSelections[userId]) {
        const decorationId = this.getSelectionDecorationId(
          userId,
          model.id,
          moduleShortid
        );
        this.userSelectionDecorations[decorationId] = model.deltaDecorations(
          this.userSelectionDecorations[decorationId] || [],
          []
        );
      }
    });
  };

  nameTagTimeouts: { [name: string]: number } = {};

  public updateUserSelections(
    module: Module,
    userSelections: EditorSelection[],
    showNameTag = true
  ) {
    const moduleModel = this.getModuleModelByPath(module.path);

    if (!moduleModel?.model) {
      return;
    }

    const model = moduleModel.model;
    const lines = model.getLinesContent() || [];

    this.cleanUserSelections(model, module.shortid, userSelections);

    userSelections.forEach((data: EditorSelection) => {
      const { userId } = data;

      const decorationId = this.getSelectionDecorationId(
        userId,
        model.id,
        module.shortid
      );
      if (data.selection === null) {
        this.userSelectionDecorations[decorationId] = model.deltaDecorations(
          this.userSelectionDecorations[decorationId] || [],
          []
        );

        return;
      }

      const decorations: Array<{
        range: any;
        options: {
          className: string;
        };
      }> = [];
      const { selection, color, name } = data;

      const getCursorDecoration = (position, className) => {
        const cursorPos = indexToLineAndColumn(lines, position);

        return {
          range: new this.monaco.Range(
            cursorPos.lineNumber,
            cursorPos.column,
            cursorPos.lineNumber,
            cursorPos.column
          ),
          options: {
            className: `${this.userClassesGenerated[className]}`,
          },
        };
      };

      const getSelectionDecoration = (start, end, className) => {
        const from = indexToLineAndColumn(lines, start);
        const to = indexToLineAndColumn(lines, end);

        return {
          range: new this.monaco.Range(
            from.lineNumber,
            from.column,
            to.lineNumber,
            to.column
          ),
          options: {
            className: this.userClassesGenerated[className],
            stickiness: 3, // GrowsOnlyWhenTypingAfter
          },
        };
      };
      const prefix = color.join('-') + userId;
      const cursorClassName = prefix + '-cursor';
      const nameTagClassName = prefix + '-nametag';
      const secondaryCursorClassName = prefix + '-secondary-cursor';
      const selectionClassName = prefix + '-selection';
      const secondarySelectionClassName = prefix + '-secondary-selection';

      if (selection && color) {
        const nameStyles = {
          content: name,
          position: 'absolute',
          bottom: '100%',
          backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
          zIndex: 200,
          color:
            (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000 > 128
              ? 'rgba(0, 0, 0, 0.8)'
              : 'white',
          padding: '0 4px',
          borderRadius: 2,
          borderBottomLeftRadius: 0,
          fontSize: '.75rem',
          fontWeight: 600,
          userSelect: 'none',
          pointerEvents: 'none',
          width: 'max-content',
          fontFamily: 'MonoLisa, Menlo, monospace',
        };
        if (!this.userClassesGenerated[cursorClassName]) {
          this.userClassesGenerated[cursorClassName] = `${css({
            display: 'inherit',
            position: 'absolute',
            backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`,
            width: '2px !important',
            height: '100%',
            cursor: 'text',
            zIndex: 200,
            ':hover': {
              ':before': {
                animation: `${fadeIn} 0.3s`,
                animationFillMode: 'forwards',
                opacity: 0,
                ...nameStyles,
              },
            },
          })}`;
        }

        if (!this.userClassesGenerated[nameTagClassName]) {
          this.userClassesGenerated[nameTagClassName] = `${css({
            ':before': {
              animation: `${fadeOut} 0.3s`,
              animationDelay: '1s',
              animationFillMode: 'forwards',
              opacity: 1,
              ...nameStyles,
            },
          })}`;
        }

        if (!this.userClassesGenerated[secondaryCursorClassName]) {
          this.userClassesGenerated[secondaryCursorClassName] = `${css({
            backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6)`,
            width: '2px !important',
          })}`;
        }

        if (!this.userClassesGenerated[selectionClassName]) {
          this.userClassesGenerated[selectionClassName] = `${css({
            backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`,
            borderRadius: '3px',
            minWidth: 7.6,
          })}`;
        }

        if (!this.userClassesGenerated[secondarySelectionClassName]) {
          this.userClassesGenerated[secondarySelectionClassName] = `${css({
            backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`,
            borderRadius: '3px',
            minWidth: 7.6,
          })}`;
        }

        decorations.push(
          getCursorDecoration(selection.primary.cursorPosition, cursorClassName)
        );

        if (selection.primary.selection.length) {
          decorations.push(
            getSelectionDecoration(
              // @ts-ignore
              selection.primary.selection[0],
              // @ts-ignore
              selection.primary.selection[1],
              selectionClassName
            )
          );
        }

        if (selection.secondary.length) {
          selection.secondary.forEach(s => {
            decorations.push(
              getCursorDecoration(s.cursorPosition, secondaryCursorClassName)
            );

            if (s.selection.length) {
              decorations.push(
                getSelectionDecoration(
                  s.selection[0],
                  s.selection[1],
                  secondarySelectionClassName
                )
              );
            }
          });
        }
      }

      this.userSelectionDecorations[decorationId] = model.deltaDecorations(
        this.userSelectionDecorations[decorationId] || [],
        decorations
      );

      if (this.nameTagTimeouts[decorationId]) {
        clearTimeout(this.nameTagTimeouts[decorationId]);
      }
      // We don't want to show the nametag when the cursor changed, because
      // another user changed the code on top of it. Otherwise it would get
      // messy very fast.
      if (showNameTag && selection.source !== 'modelChange') {
        const decoration = model.deltaDecorations(
          [],
          [
            getCursorDecoration(
              selection.primary.cursorPosition,
              nameTagClassName
            ),
          ]
        );
        this.userSelectionDecorations[decorationId].push(decoration);
        this.nameTagTimeouts[decorationId] = window.setTimeout(() => {
          if (!model.isDisposed()) {
            // And now hide the nametag after 1.5s
            model.deltaDecorations([decoration], []);
          }
        }, 1500);
      }
    });
  }

  private applyOperationToModel(
    operation: TextOperation,
    pushStack = false,
    model = this.editorApi.getActiveCodeEditor().getModel()
  ) {
    const results: Array<{
      range: unknown;
      text: string;
      forceMoveMarkers?: boolean;
    }> = [];
    let index = 0;
    const currentEOLLength = model.getEOL().length;
    let eolChanged = false;
    const modelCode = model.getValue();

    if (operation.baseLength !== modelCode.length) {
      throw new Error(
        "The base length of the operation doesn't match the length of the code"
      );
    }

    for (let i = 0; i < operation.ops.length; i++) {
      const op = operation.ops[i];
      if (TextOperation.isRetain(op)) {
        index += op as number;
      } else if (TextOperation.isInsert(op)) {
        const textOp = op as string;
        const { lineNumber, column } = indexToLineAndColumn(
          model.getValue().split(/\n/) || [],
          index
        );
        const range = new this.monaco.Range(
          lineNumber,
          column,
          lineNumber,
          column
        );

        // if there's a new line
        if (/\n/.test(textOp)) {
          const eol = /\r\n/.test(textOp) ? 2 : 1;
          if (eol !== currentEOLLength) {
            // With this insert the EOL of the document changed on the other side. We need
            // to accomodate our EOL to it.
            eolChanged = true;
          }
        }

        results.push({
          range,
          text: textOp,
          forceMoveMarkers: true,
        });
      } else if (TextOperation.isDelete(op)) {
        const delOp = op as number;
        const lines = model.getValue().split(/\n/) || [];
        const from = indexToLineAndColumn(lines, index);
        const to = indexToLineAndColumn(lines, index - delOp);
        results.push({
          range: new this.monaco.Range(
            from.lineNumber,
            from.column,
            to.lineNumber,
            to.column
          ),
          text: '',
        });
        index -= delOp;
      }
    }

    if (eolChanged) {
      const newEolMode = currentEOLLength === 2 ? 0 : 1;
      model.setEOL(newEolMode);
    }

    if (pushStack) {
      model.pushEditOperations([], results);
    } else {
      model.applyEdits(results);
    }
  }

  private listenForChanges() {
    this.modelAddedListener = this.editorApi.textFileService.modelService.onModelAdded(
      model => {
        try {
          const module = resolveModule(
            model.uri.path.replace(/^\/sandbox/, ''),
            this.sandbox.modules,
            this.sandbox.directories
          );

          const moduleModel = this.getOrCreateModuleModelByPath(module.path);

          moduleModel.model = model;
          moduleModel.changeListener = this.getModelContentChangeListener(
            this.sandbox,
            model
          );
        } catch (e) {
          // File does not exist anymore for some reason
        }
      }
    );

    this.modelRemovedListener = this.editorApi.textFileService.modelService.onModelRemoved(
      model => {
        if (this.moduleModels[model.uri.path]) {
          const changeListener = this.moduleModels[model.uri.path]
            .changeListener;
          if (changeListener) {
            changeListener.dispose();
          }

          const csbPath = model.uri.path.replace('/sandbox', '');
          dispatch(actions.correction.clear(csbPath, 'eslint'));

          // We only delete the model, because the state contains things
          // like comments, which we want to keep
          delete this.moduleModels[model.uri.path].model;
        }
      }
    );
  }

  private getModelContentChangeListener(sandbox: Sandbox, model) {
    return model.onDidChangeContent(e => {
      if (this.isApplyingOperation) {
        return;
      }

      const { path } = model.uri;
      try {
        const module = resolveModule(
          path.replace(/^\/sandbox/, ''),
          sandbox.modules,
          sandbox.directories
        );

        this.onChangeCallback({
          moduleShortid: module.shortid,
          title: module.title,
          code: model.getValue(),
          event: e,
          model,
        });
      } catch (err) {
        // This can throw when a file is deleted and you add new code to it. When
        // saving it a new file is created
      }
    });
  }

  private createCommentDecorations(
    commentThreadDecorations: Array<{
      commentId: string;
      range: [number, number];
    }>,
    model: any,
    currentCommentThreadId: string | null,
    currentLineNumber: number
  ) {
    if (
      !hasPermission(this.sandbox.authorization, 'comment') ||
      !this.sandbox.featureFlags.comments
    ) {
      return [];
    }
    const commentDecorationsByLineNumber = commentThreadDecorations.reduce<{
      [lineNumber: string]: Array<{
        commentId: string;
        range: [number, number];
      }>;
    }>((aggr, commentDecoration) => {
      const { lineNumber } = indexToLineAndColumn(
        model.getLinesContent() || [],
        commentDecoration.range[0]
      );

      if (!aggr[lineNumber]) {
        aggr[lineNumber] = [];
      }

      aggr[lineNumber].push(commentDecoration);

      return aggr;
    }, {});

    const initialDecorations: any[] =
      currentLineNumber === -1 ||
      currentLineNumber in commentDecorationsByLineNumber
        ? []
        : [
            {
              range: new this.monaco.Range(
                currentLineNumber,
                1,
                currentLineNumber,
                1
              ),
              options: {
                isWholeLine: true,
                glyphMarginClassName: `editor-comments-glyph editor-comments-multi editor-comments-add`,
              },
            },
          ];

    return Object.keys(commentDecorationsByLineNumber).reduce(
      (aggr, lineNumberKey) => {
        const lineCommentDecorations =
          commentDecorationsByLineNumber[lineNumberKey];
        const lineNumber = Number(lineNumberKey);
        const activeCommentDecoration = lineCommentDecorations.find(
          commentDecoration =>
            commentDecoration.commentId === currentCommentThreadId
        );
        const ids = lineCommentDecorations.map(
          commentDecoration => commentDecoration.commentId
        );
        const commentRange = activeCommentDecoration
          ? [
              indexToLineAndColumn(
                model.getLinesContent() || [],
                activeCommentDecoration.range[0]
              ),
              indexToLineAndColumn(
                model.getLinesContent() || [],
                activeCommentDecoration.range[1]
              ),
            ]
          : null;

        return aggr.concat(
          {
            range: new this.monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
              // comment-id- class needs to be the LAST class!
              glyphMarginClassName: `editor-comments-glyph ${
                activeCommentDecoration ? 'editor-comments-active ' : ''
              }${
                ids.length > 1
                  ? `editor-comments-multi editor-comments-multi-${ids.length} `
                  : ''
              }editor-comments-ids-${ids.join('_')}`,
            },
          },
          commentRange
            ? {
                range: new this.monaco.Range(
                  commentRange[0].lineNumber,
                  commentRange[0].column,
                  commentRange[1].lineNumber,
                  commentRange[1].column
                ),
                options: {
                  isWholeLine:
                    commentRange[0].lineNumber === commentRange[1].lineNumber &&
                    commentRange[0].column === commentRange[1].column,
                  className: activeCommentDecoration
                    ? 'editor-comments-highlight'
                    : undefined,
                },
              }
            : []
        );
      },
      initialDecorations
    );
  }
}
