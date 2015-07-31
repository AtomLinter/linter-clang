"use babel";

export default {
  config: {
    // It should be noted that I, Kepler, hate these Config names. However these
    //  are the names in use by many people. Changing them for the sake of clean
    //  of clean code would cause a mess for our users. Because of this we
    //  override the titles the editor gives them in the settings pane.
    execPath: {
      type: "string",
      default: "clang"
    },
    clangIncludePaths: {
      type: "string",
      default: "."
    },
    clangSuppressWarnings: {
      type: "boolean",
      default: false
    },
    clangDefaultCFlags: {
      type: "string",
      default: "-Wall"
    },
    clangDefaultCppFlags: {
      type: "string",
      default: "-Wall -std=c++11"
    },
    clangDefaultObjCFlags: {
      type: "string",
      default: ""
    },
    clangDefaultObjCppFlags: {
      type: "string",
      default: ""
    },
    clangErrorLimit: {
      type: "integer",
      default: 0
    },
    verboseDebug: {
      type: "boolean",
      default: false
    }
  },

  activate: () => {
    // Because all four of the languages this linter supports have grammmars
    //  have grammmars built into the editor we do not need to throw errors when
    //  one any one of the lanugages isn't installed. If a user has the grammar
    //  disabled that is a choice they have made.

    // Show the user an error if they do not have an appropriate linter base
    //  package installed from Atom Package Manager. This will not be an issues
    //  after a base linter package is integrated into Atom, in the comming
    //  months.
    // TODO: Remove when Linter Base is integrated into Atom.
    if(!atom.packages.getLoadedPackages("linter")) {
      atom.notifications.addError(
        "Linter package not found.",
        {
          detail: "Please install the `linter` package in your Settings view."
        }
      );
    }
  },

  provideLinter: () => {
    const helpers = require("atom-linter");
    const regex = "(?<file>.+):(?<line>\\d+):(?<col>\\d+):(\{(?<lineStart>\\d+):(?<colStart>\\d+)\-(?<lineEnd>\\d+):(?<colEnd>\\d+)}.*:)? (?<type>.+): (?<message>.*)";
    return {
      grammarScopes: ["source.c", "source.cpp", "source.objc", "source.objcpp"],
      scope: "file",
      lintOnFly: false,
      lint: (activeEditor) => {
        const command = atom.config.get("linter-clang.execPath");
        const file = activeEditor.getPath();
        const args = ["-fsyntax-only",
          "-fno-caret-diagnostics",
          "-fno-diagnostics-fixit-info",
          "-fdiagnostics-print-source-range-info",
          "-fexceptions"];

        if(activeEditor.getGrammar().name === "C++") {
          //const language = "c++";
          args.push("-xc++");
          args.push(atom.config.get("linter-clang.clangDefaultCppFlags"));
        }
        if(activeEditor.getGrammar().name === "Objective-C++") {
          //const language = "objective-c++";
          args.push("-xobjective-c++");
          args.push(atom.config.get("linter-clang.clangDefaultObjCppFlags"));
        }
        if(activeEditor.getGrammar().name === "C") {
          //const language = "c";
          args.push("-xc");
          args.push(atom.config.get("linter-clang.clangDefaultCFlags"));
        }
        if(activeEditor.getGrammar().name === "Objective-C") {
          //const language = "objective-c";
          args.push("-xobjective-c");
          args.push(atom.config.get("linter-clang.clangDefaultObjCFlags"));
        }

        // The file is added to the arguments last.
        args.push(file);
        return helpers.exec(command, args, {stream: "stderr"}).then(output =>
          helpers.parse(output, regex)
        );
      }
    };
  }
};
