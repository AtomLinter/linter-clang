'use babel';

let helpers = null;
let clangFlags = null;

export default {
  config: {
    execPath: {
      type: 'string',
      default: 'clang',
    },
    clangIncludePaths: {
      type: 'array',
      default: ['.'],
    },
    clangSuppressWarnings: {
      type: 'boolean',
      default: false,
    },
    clangDefaultCFlags: {
      type: 'string',
      default: '-Wall',
    },
    clangDefaultCppFlags: {
      type: 'string',
      default: '-Wall -std=c++11',
    },
    clangDefaultObjCFlags: {
      type: 'string',
      default: '',
    },
    clangDefaultObjCppFlags: {
      type: 'string',
      default: '',
    },
    clangErrorLimit: {
      type: 'integer',
      default: 0,
    },
  },

  activate() {
    require('atom-package-deps').install('linter-clang');
  },

  provideLinter() {
    const regex = '(?<file>.+):(?<line>\\d+):(?<col>\\d+):({(?<lineStart>\\d+):(?<colStart>\\d+)-(?<lineEnd>\\d+):(?<colEnd>\\d+)}.*:)? (?<type>[\\w \\-]+): (?<message>.*)';
    return {
      name: 'clang',
      grammarScopes: ['source.c', 'source.cpp', 'source.objc', 'source.objcpp'],
      scope: 'file',
      lintOnFly: false,
      lint: (activeEditor) => {
        if (helpers === null) {
          helpers = require('atom-linter');
        }
        if (clangFlags === null) {
          clangFlags = require('clang-flags');
        }
        const command = atom.config.get('linter-clang.execPath');
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
          args.push(...atom.config.get('linter-clang.clangDefaultCppFlags').split(/\s+/));
        }
        if (grammar === 'Objective-C++') {
          args.push('-xobjective-c++');
          args.push(...atom.config.get('linter-clang.clangDefaultObjCppFlags').split(/\s+/));
        }
        if (grammar === 'C') {
          args.push('-xc');
          args.push(...atom.config.get('linter-clang.clangDefaultCFlags').split(/\s+/));
        }
        if (grammar === 'Objective-C') {
          args.push('-xobjective-c');
          args.push(...atom.config.get('linter-clang.clangDefaultObjCFlags').split(/\s+/));
        }

        args.push(`-ferror-limit=${atom.config.get('linter-clang.clangErrorLimit')}`);
        if (atom.config.get('linter-clang.clangSuppressWarnings')) {
          args.push('-w');
        }
        if (atom.inDevMode()) {
          args.push('--verbose');
        }

        atom.config.get('linter-clang.clangIncludePaths').forEach(path =>
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

        return helpers.exec(command, args, execOpts).then(output =>
          helpers.parse(output, regex),
        );
      },
    };
  },
};
