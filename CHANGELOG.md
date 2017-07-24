# Changelog

_`linter-clang` follows [semantic versioning](http://semver.org/)_

## v4.1.2

-   Fix the config key being set when migrating old settings

## v4.1.1

-   Remove usage of `-fdiagnostics-absolute-paths`, fixing `clang` < v4.0.0

## v4.1.0

-   Rewrite the parser engine
-   Disable on change linting if a `.clang-complete` file is in use
-   Support suggested fixes
-   Handle multiple ranges from clang, using a merger of all given
-   Better support for ranges in other files
-   Much more complete specs

## v4.0.0

-   Move to Linter v2
-   Support linting current editor contents
-   Run `clang` from the directory of the file being linted
-   Filter out `#pragma once` warnings from header files
-   Rename the `execPath` setting to `executablePath` to match other providers

## v3.4.9

-   Fix declaration of member functions

## v3.4.8

-   Fix package dependency specification

## v3.4.7

-   Dependency updates

## v3.4.6

-   Fix linting valid files

## v3.4.5

-   Update dependencies
-   Remove unused styles
-   Fix specs

## v3.1.3 - v3.4.4

-   _Undocumented..._

## v3.1.3

-   Fix flags parsing.

## v3.1.2

-   Clean up some repo level documentation. (README and CHANGLOG)

## v3.1.1

-   Fix type field capturing more information than needed in some instances.

## v3.1.0

-   Support for `.clang_complete` files added.
-   Support for [Clang JSON Compilation Database](http://clang.llvm.org/docs/JSONCompilationDatabase.html) added.

## v3.0.0

-   Rewritten in ECMAScript 2015 for AtomLinter v1.0.0.
-   `.linter-clang-flags` support removed.

## v2.26.2

-   Fix regex cacheing.

## v2.26.1

-   Fix Linter install in certain cases.

## v2.7.0-v2.25.0

-   **Change in management. Will document later.**

## v2.6.0

### Bug Fixes

-   Linter based now on C++11

## v2.5.0

### New Features

-   Change include path without restart Atom
-   Add option to suppress warnings
