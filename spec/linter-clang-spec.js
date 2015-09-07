'use babel'

describe('The Clang provider for AtomLinter', () => {
  const provider = require('../lib/main').provideLinter()
  describe('finds issue with the code', () => {
    it('works in "missing_import.c"', () => {
      waitsForPromise(() =>
        atom.workspace.open(__dirname + '/files/missing_import.c').then(editor => {
          console.log(editor)
        })
      )
    })
  })
})
