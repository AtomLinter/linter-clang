'use babel';

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom';

let helpers = null;
let clangFlags = null;

export default {
  activate() {
    require('atom-package-deps').install('linter-clang');
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      atom.config.observe('linter-clang.execPath', (value) => {
        this.execPath = value;
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
    const regex = '(?<file>.+):(?<line>\\d+):(?<col>\\d+):({(?<lineStart>\\d+):(?<colStart>\\d+)-(?<lineEnd>\\d+):(?<colEnd>\\d+)}.*:)? (?<type>[\\w \\-]+): (?<message>.*)';
    return {
      name: 'clang',
      scope: 'file',
      lintOnFly: false,
      grammarScopes: ['source.c', 'source.cpp', 'source.objc', 'source.objcpp'],
      lint: (activeEditor) => {
        if (helpers === null) {
          helpers = require('atom-linter');
        }
        if (clangFlags === null) {
          clangFlags = require('clang-flags');
        }

        const filePath = activeEditor.getPath();
        const args = [
          '-fsyntax-only',
          '-fno-caret-diagnostics',
          '-fno-diagnostics-fixit-info',
          '-fdiagnostics-print-source-range-info',
          '-fexceptions',
        ];

        const grammar = activeEditor.getGrammar().name;

        if (/^C\+\+/.test(grammar)) {
          args.push('-xc++');
          args.push(...this.clangDefaultCppFlags.split(/\s+/));
        }
        if (grammar === 'Objective-C++') {
          args.push('-xobjective-c++');
          args.push(...this.clangDefaultObjCppFlags.split(/\s+/));
        }
        if (grammar === 'C') {
          args.push('-xc');
          args.push(...this.clangDefaultCFlags.split(/\s+/));
        }
        if (grammar === 'Objective-C') {
          args.push('-xobjective-c');
          args.push(...this.clangDefaultObjCFlags.split(/\s+/));
        }

        args.push(`-ferror-limit=${this.clangErrorLimit}`);
        if (this.clangSuppressWarnings) {
          args.push('-w');
        }
        if (atom.inDevMode()) {
          args.push('--verbose');
        }

        this.clangIncludePaths.forEach(path =>
          args.push(`-I${path}`),
        );

        try {
          const flags = clangFlags.getClangFlags(filePath);
          if (flags) {
            args.push(...flags);
          }
        } catch (error) {
          if (atom.inDevMode()) {
            // eslint-disable-next-line no-console
            console.log(error);
          }
        }
        args.push(filePath);

        const execOpts = {
          stream: 'stderr',
          allowEmptyStderr: true,
        };

        return helpers.exec(this.execPath, args, execOpts).then(output =>
          helpers.parse(output, regex),
        );
      },
    };
  },
};
