"use babel";

describe("The Clang Provider for AtomLinter", () => {
  beforeEach(() => {
    waitsForPromise(() => {
      atom.packages.activatePackage("linter-clang");
    });
  });

  describe("finds issue with the code", () => {
    describe("in 'missing_import.c'", () => {
      waitsForPromise(() => {
        atom.workspace.open("missing_import.c");
      });
    });

    describe("in 'missing_import.cpp'", () => {
      waitsForPromise(() => {
        atom.workspace.open("missing_import.cpp");
      });
    });

    describe("in 'missing_import.m'", () => {
      waitsForPromise(() => {
        atom.workspace.open("missing_import.m");
      });
    });

    describe("in 'missing_import.mm'", () => {
      waitsForPromise(() => {
        atom.workspace.open("missing_import.mm");
      });
    });
  });
});
