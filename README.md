# linter-clang package

This linter plugin for [Linter](https://github.com/AtomLinter/Linter) provides an interface to clang. It will be used with files that have the "C++", "C", "Objective-C" and "Objective-C++" syntax.

### Plugin installation
Install from the Settings pane of Atom by searching for and installing both the `linter` and `linter-clang` packages.

Or install from your Command Prompt by running:
```
$ apm install linter
$ apm install linter-clang
```

## Project-specific settings
If your project has some extra include directories, put them in a file called ".clang_complete" and list them line by line.
The linter will open the file and use the specified paths when linting in your project.

As well the [Clang JSON Compilation Database](http://clang.llvm.org/docs/JSONCompilationDatabase.html) is a supported format for project specific settings.
