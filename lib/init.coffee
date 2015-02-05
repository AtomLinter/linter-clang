module.exports =
  configDefaults:
    clangCommand: 'clang'
    clangIncludePaths: '.'
    clangSuppressWarnings: false
    clangDefaultCFlags: '-Wall'
    clangDefaultCppFlags: '-Wall -std=c++11'
    clangDefaultObjCFlags: ' '
    clangDefaultObjCppFlags: ' '
    clangErrorLimit: 0
    verboseDebug: false

  activate: ->
    console.log 'activate linter-clang' if atom.inDevMode()
