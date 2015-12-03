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
    libraryPath: {
      title: "`libclang` Path",
      description: "Can be set to an exact location of the Clang library, by default will find in library search path.",
      type: "string",
      default: "libclang"
    },
    clangIncludePaths: {
      type: "array",
      default: ["."]
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
    require("atom-package-deps").install("linter-clang");
  },

  provideLinter: () => {
    const helpers = require("atom-linter");
    const clangFlags = require("clang-flags");
    return {
      name: "Clang",
      grammarScopes: ["source.c", "source.cpp", "source.objc", "source.objcpp"],
      scope: "file",
      lintOnFly: false,
      lint: (activeEditor) => {
        const libclang = require("./libclang_wrapper")
        const file = activeEditor.getPath();
        const args = ["-fsyntax-only",
          "-fno-caret-diagnostics",
          "-fno-diagnostics-fixit-info",
          "-fdiagnostics-print-source-range-info",
          "-fexceptions"];
        const grammar = activeEditor.getGrammar().name;

        if(/^C\+\+/.test(grammar)) {
          //const language = "c++";
          args.push("-xc++");
          args.push(...atom.config.get("linter-clang.clangDefaultCppFlags").split(/\s+/));
        }
        if(grammar === "Objective-C++") {
          //const language = "objective-c++";
          args.push("-xobjective-c++");
          args.push(...atom.config.get("linter-clang.clangDefaultObjCppFlags").split(/\s+/));
        }
        if(grammar === "C") {
          //const language = "c";
          args.push("-xc");
          args.push(...atom.config.get("linter-clang.clangDefaultCFlags").split(/\s+/));
        }
        if(grammar === "Objective-C") {
          //const language = "objective-c";
          args.push("-xobjective-c");
          args.push(...atom.config.get("linter-clang.clangDefaultObjCFlags").split(/\s+/));
        }

        args.push(`-ferror-limit=${atom.config.get("linter-clang.clangErrorLimit")}`);
        if(atom.config.get("linter-clang.clangSuppressWarnings")) {
          args.push("-w");
        }
        if(atom.config.get("linter-clang.verboseDebug")) {
          args.push("--verbose");
        }

        atom.config.get("linter-clang.clangIncludePaths").forEach((path) =>
          args.push(`-I${path}`)
        );

        try {
          flags = clangFlags.getClangFlags(activeEditor.getPath());
          if(flags) {
            args.push.apply(args, flags);
          }
        }
        catch (error) {
          if(atom.config.get("linter-clang.verboseDebug")) {
            console.log(error);
          }
        }

        const wrapper = new libclang(file, args)
        const results = wrapper.get_diagnostics()
        wrapper.dispose()
        return(results)
      }
    };
  }
};
