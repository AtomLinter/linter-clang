"use babel";

describe('The Clang provider for AtomLinter', () => {
  const lint = require('../lib/main').provideLinter().lint

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.packages.activatePackage("linter-clang")
    })
    if (process.env.CI) {
      console.log("Unit Tests running in a Continuous Integration environment.");
      if (process.platform === "darwin") {
        console.log("Unit Tests running on OS X.");
        atom.config.set("linter-clang.libraryPath", "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/libclang.dylib")
      }
    }
  })

  it('finds a fatal error in "missing_import.c"', () => {
    waitsForPromise(() => {
      return atom.workspace.open(__dirname + '/files/missing_import.c').then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(1)
          expect(messages[0].type).toEqual("fatal error")
          expect(messages[0].text).toEqual("'nothing.h' file not found")
        })
      })
    })
  })

  it('finds a fatal error in "missing_import.cpp"', () => {
    waitsForPromise(() => {
      return atom.workspace.open(__dirname + '/files/missing_import.cpp').then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(1)
          expect(messages[0].type).toEqual("fatal error")
          expect(messages[0].text).toEqual("'nothing.h' file not found")
        })
      })
    })
  })

  it('finds a fatal error in "missing_import.m"', () => {
    waitsForPromise(() => {
      return atom.workspace.open(__dirname + '/files/missing_import.m').then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(1)
          expect(messages[0].type).toEqual("fatal error")
          expect(messages[0].text).toEqual("'nothing.h' file not found")
        })
      })
    })
  })

  it('finds a fatal error in "missing_import.mm"', () => {
    waitsForPromise(() => {
      return atom.workspace.open(__dirname + '/files/missing_import.mm').then(editor => {
        return lint(editor).then(messages => {
          expect(messages.length).toEqual(1)
          expect(messages[0].type).toEqual("fatal error")
          expect(messages[0].text).toEqual("'nothing.h' file not found")
        })
      })
    })
  })
})
