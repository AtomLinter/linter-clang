'use babel';

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom';
import { dirname, extname, resolve, isAbsolute } from 'path';

let helpers = null;
let clangFlags = null;

const regex = new RegExp([
  '^(<stdin>|.+):', // Path, usually <stdin>
  '(\\d+):(\\d+):', // Base line and column
  '(?:({.+}):)?', // Range position(s), if present
  ' ([\\w \\\\-]+):', // Message type
  ' ([^[\\n\\r]+)', // The message
  '(?: \\[(.+)\\])?\\r?$', // -W flag, if any
  '(?:\\r?\\n^ .+$)+', // The visual caret diagnostics, necessary to include in output for fix-its
  '(?:\\r?\\n^fix-it:".+":', // Start of fix-it block
  '{(\\d+):(\\d+)-(\\d+):(\\d+)}:', // fix-it range
  '"(.+)"', // fix-it replacement text
  '$)?', // End of fix-it block
].join(''), 'gm');

/**
 * Given a set of ranges in clangs format, determine the range encompasing all points
 * @param  {String} ranges The raw range string to parse
 * @return {Range}        An Atom Range object encompasing all given ranges
 */
const parseClangRanges = (ranges) => {
  const rangeRE = /{(\d+):(\d+)-(\d+):(\d+)}/g;
  let lineStart;
  let colStart;
  let lineEnd;
  let colEnd;

  let match = rangeRE.exec(ranges);
  while (match !== null) {
    const rangeLineStart = Number.parseInt(match[1], 10) - 1;
    const rangeColStart = Number.parseInt(match[2], 10) - 1;
    const rangeLineEnd = Number.parseInt(match[3], 10) - 1;
    const rangeColEnd = Number.parseInt(match[4], 10) - 1;
    if (lineStart === undefined) {
      // First match
      lineStart = rangeLineStart;
      colStart = rangeColStart;
      lineEnd = rangeLineEnd;
      colEnd = rangeColEnd;
    } else {
      if (rangeLineStart > lineEnd) {
        // Higher starting line
        lineEnd = rangeLineStart;
        colEnd = rangeColStart;
      }
      if (rangeLineEnd > lineEnd) {
        // Higher ending line
        lineEnd = rangeLineEnd;
        colEnd = rangeColEnd;
      }
      if (rangeColEnd > colEnd) {
        // Higher ending column
        colEnd = rangeColEnd;
      }
    }
    match = rangeRE.exec(ranges);
  }
  return [[lineStart, colStart], [lineEnd, colEnd]];
};

/**
 * Determine if a given path is open in an existing TextEditor
 * @param  {String} filePath The file path to search for an editor of
 * @return {TextEditor | false}      The TextEditor or false if none found
 */
const findTextEditor = (filePath) => {
  const allEditors = atom.workspace.getTextEditors();
  const matchingEditor = allEditors.find(
    textEditor => textEditor.getPath() === filePath);
  return matchingEditor || false;
};

export default {
  activate() {
    require('atom-package-deps').install('linter-clang');

    // FIXME: Remove backwards compatibility in a future minor version
    const oldPath = atom.config.get('linter-clang.execPath');
    if (oldPath !== undefined) {
      atom.config.unset('linter-clang.execPath');
      if (oldPath !== 'clang') {
        // If the old config wasn't set to the default migrate it over
        atom.config.set('linter-clang.executablePath', oldPath);
      }
    }

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      atom.config.observe('linter-clang.executablePath', (value) => {
        this.executablePath = value;
      }),
    );
    this.subscriptions.add(
      atom.config.observe('linter-clang.clangIncludePaths', (value) => {
        this.clangIncludePaths = value;
      }),
    );
    this.subscriptions.add(
      atom.config.observe('linter-clang.clangSuppressWarnings', (value) => {
        this.clangSuppressWarnings = value;
      }),
    );
    this.subscriptions.add(
      atom.config.observe('linter-clang.clangDefaultCFlags', (value) => {
        this.clangDefaultCFlags = value;
      }),
    );
    this.subscriptions.add(
      atom.config.observe('linter-clang.clangDefaultCppFlags', (value) => {
        this.clangDefaultCppFlags = value;
      }),
    );
    this.subscriptions.add(
      atom.config.observe('linter-clang.clangDefaultObjCFlags', (value) => {
        this.clangDefaultObjCFlags = value;
      }),
    );
    this.subscriptions.add(
      atom.config.observe('linter-clang.clangDefaultObjCppFlags', (value) => {
        this.clangDefaultObjCppFlags = value;
      }),
    );
    this.subscriptions.add(
      atom.config.observe('linter-clang.clangErrorLimit', (value) => {
        this.clangErrorLimit = value;
      }),
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'clang',
      scope: 'file',
      lintsOnChange: true,
      grammarScopes: ['source.c', 'source.cpp', 'source.objc', 'source.objcpp'],
      lint: async (editor) => {
        if (helpers === null) {
          helpers = require('atom-linter');
        }
        if (clangFlags === null) {
          clangFlags = require('clang-flags');
        }

        const filePath = editor.getPath();
        if (typeof filePath === 'undefined') {
          // The editor has no path, meaning it hasn't been saved. Although
          // clang could give us results for this, Linter needs a path
          return [];
        }
        const fileExt = extname(filePath);
        const fileDir = dirname(filePath);
        const fileText = editor.getText();
        let basePath;

        const args = [
          '-fsyntax-only',
          '-fno-color-diagnostics',
          '-fdiagnostics-parseable-fixits',
          '-fdiagnostics-print-source-range-info',
          '-fexceptions',
          `-ferror-limit=${this.clangErrorLimit}`,
        ];

        // Non-Public API!
        const grammar = editor.getGrammar().name;

        switch (grammar) {
          case 'Objective-C':
            args.push('-xobjective-c');
            args.push(...this.clangDefaultObjCFlags.split(/\s+/));
            break;
          case 'Objective-C++':
            args.push('-xobjective-c++');
            args.push(...this.clangDefaultObjCppFlags.split(/\s+/));
            break;
          case 'C':
            args.push('-xc');
            args.push(...this.clangDefaultCFlags.split(/\s+/));
            break;
          default:
          case 'C++':
          case 'C++14':
            args.push('-xc++');
            args.push(...this.clangDefaultCppFlags.split(/\s+/));
            break;
        }

        if (fileExt === '.hpp' || fileExt === '.hh' || fileExt === '.h') {
          // Don't warn about #pragma once when linting header files
          args.push('-Wno-pragma-once-outside-header');
        }

        if (this.clangSuppressWarnings) {
          args.push('-w');
        }

        if (atom.inDevMode()) {
          args.push('--verbose');
        }

        this.clangIncludePaths.forEach(path =>
          args.push(`-I${path}`),
        );

        let usingClangComplete = false;
        try {
          const flags = clangFlags.getClangFlags(filePath);
          flags.forEach((flag) => {
            args.push(flag);
            usingClangComplete = true;
            const workingDir = /-working-directory=(.+)/.exec(flag);
            if (workingDir !== null) {
              basePath = workingDir[1];
            }
          });
        } catch (error) {
          if (atom.inDevMode()) {
            // eslint-disable-next-line no-console
            console.log(error);
          }
        }

        if (editor.isModified() && usingClangComplete) {
          // If the user has a .clang-complete file we can't lint current
          // TextEditor contents, return null so nothing gets modified
          return null;
        }

        const execOpts = {
          stream: 'stderr',
          allowEmptyStderr: true,
        };

        if (usingClangComplete) {
          args.push(filePath);
        } else {
          args.push('-');
          execOpts.stdin = fileText;
          execOpts.cwd = fileDir;
          basePath = fileDir;
        }

        const output = await helpers.exec(this.executablePath, args, execOpts);

        if (editor.getText() !== fileText) {
          // Editor contents have changed, tell Linter not to update results
          return null;
        }

        const toReturn = [];

        let match = regex.exec(output);
        while (match !== null) {
          const isCurrentFile = match[1] === '<stdin>';
          // If the "file" is stdin, override to the current editor's path
          let file;
          if (isCurrentFile) {
            file = filePath;
          } else if (isAbsolute(match[1])) {
            file = match[1];
          } else {
            file = resolve(basePath, match[1]);
          }
          let position;
          if (match[4]) {
            // Clang gave us a range, use that
            position = parseClangRanges(match[4]);
          } else {
            // Generate a range based on the single point
            const line = Number.parseInt(match[2], 10) - 1;
            const col = Number.parseInt(match[3], 10) - 1;
            if (!isCurrentFile) {
              const fileEditor = findTextEditor(file);
              if (fileEditor !== false) {
                // Found an open editor for the file
                position = helpers.generateRange(fileEditor, line, col);
              } else {
                // Generate a one character range in the file
                position = [[line, col], [line, col + 1]];
              }
            } else {
              position = helpers.generateRange(editor, line, col);
            }
          }
          const severity = /error/.test(match[5]) ? 'error' : 'warning';
          let excerpt;
          if (match[7]) {
            // There is a -Wflag specified, for now just re-insert that into the excerpt
            excerpt = `${match[6]} [${match[7]}]`;
          } else {
            excerpt = match[6];
          }
          const message = {
            severity,
            location: { file, position },
            excerpt,
          };
          if (match[8]) {
            // We have a suggested fix available
            const fixLineStart = Number.parseInt(match[8], 10) - 1;
            const fixColStart = Number.parseInt(match[9], 10) - 1;
            const fixLineEnd = Number.parseInt(match[10], 10) - 1;
            const fixColEnd = Number.parseInt(match[11], 10) - 1;
            message.solutions = [{
              position: [[fixLineStart, fixColStart], [fixLineEnd, fixColEnd]],
              replaceWith: match[12],
            }];
          }
          toReturn.push(message);
          match = regex.exec(output);
        }

        return toReturn;
      },
    };
  },
};
