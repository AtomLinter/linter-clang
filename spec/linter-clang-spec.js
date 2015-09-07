"use babel";

provider = require("../lib/main").provideLinter();

describe("The Clang Provider for AtomLinter", () => {
  beforeEach(() => {
    waitsForPromise(() => {
      atom.packages.activatePackage("linter-clang");
    });
  });

  describe("finds issue with the code", () => {
    it("in 'missing_import.c'", () => {
      waitsForPromise(() => {
        atom.workspace.open("./files/missing_import.c").then((editor) => {
          provider.lint(editor).then((messages) => {
            expect(messages.length).toEqual(0);
            expect(messages[0].text).toEqual("'nothing.h' file not found");
          });
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
