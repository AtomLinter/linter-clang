# linter-clang

[![Travis.ci Shield](https://img.shields.io/travis/AtomLinter/linter-clang/master.svg?style=flat-square&label=linux)](https://travis-ci.org/AtomLinter/linter-clang)
[![Travis.ci Shield](https://img.shields.io/travis/AtomLinter/linter-clang/master.svg?style=flat-square&label=os%20x)](https://travis-ci.org/AtomLinter/linter-clang)
[![AppVeyor Sheild](https://img.shields.io/appveyor/ci/AtomLinter/linter-clang/master.svg?style=flat-square&label=windows)](https://ci.appveyor.com/project/kepler0/linter-clang)

This linter plugin for [Linter](https://github.com/AtomLinter/Linter) provides an interface to clang. It will be used with files that have the "C++", "C", "Objective-C" and "Objective-C++" syntax.

### Plugin installation
Install from the Settings pane of Atom by searching for and installing the `linter-clang` package.

Or install from your Command Prompt by running:
```
$ apm install linter-clang
```

This package will ensure that all dependencies are installed on activation.

## Project-specific settings

### .clang_complete
If your project has some extra include directories, put them in a file called ".clang_complete" and list them line by line.
The linter will open the file and use the specified paths when linting in your project.

```
-Iinclude
-Ilib/foo/include
```
Please note the file should contain one command line argument per line.
These arguments are passed to clang directly using exec and not via a shell.
Therefore any spaces are treated as a part of the command line argument.

This means on the one hand `-I include` results in clang using ` include` (note the space at the beginning) as include directory.
For the same reason `-I include -I lib/foo/include` causes clang to search for includes in ` include -I lib/foo/include`.

On the other hand if your path contains spaces you must not escape them or put quotes around the path.
For example: `-Ilib/dir with spaces/include` only works without any quotes or escaping.

### Clang JSON Compilation Database
The [Clang JSON Compilation Database](http://clang.llvm.org/docs/JSONCompilationDatabase.html) is also a supported format for project specific settings.
