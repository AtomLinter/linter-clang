"use babel";

describe('The Clang provider for AtomLinter', () => {
  const lint = require('../lib/main').provideLinter().lint

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.packages.activatePackage("linter-clang")
    })
  })

  it('finds a fatal error in "missing_import.c"', () => {
    waitsForPromise(() => {
      return atom.workspace.open(__dirname + '/files/missing_import.c').then(editor => {
        return lint(editor).then(messages => {
          console.log(messages);
        })
      })
    })
  })
})
