"use babel";

describe("The Clang Provider for AtomLinter", () => {

  beforeEach(() => {
    provider = require("../lib/main").provideLinter();
    
    waitsForPromise(() => {
      return atom.packages.activatePackage("linter-clang")
    });
  });

  describe("finds issue with the code", () => {
    describe("in 'missing_import.c'", () => {
      waitsForPromise(() => {
        return atom.workspace.open("./files/missing_import.c").then((editor) => {
          console.log(editor);
        });
      });
    });

    describe("in 'missing_import.cpp'", () => {
      beforeEach(() => {
        waitsForPromise(() => {
          atom.workspace.open("missing_import.cpp");
        });
      });
    });

    describe("in 'missing_import.m'", () => {
      beforeEach(() => {
        waitsForPromise(() => {
          atom.workspace.open("missing_import.m");
        });
      });
    });

    describe("in 'missing_import.mm'", () => {
      beforeEach(() => {
        waitsForPromise(() => {
          atom.workspace.open("missing_import.mm");
        });
      });
    });
  });
});
