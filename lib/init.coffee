module.exports =
  configDefaults:
    clangCommand: 'clang'
    clangPlusPlusCommand: 'clang++'
    clangExecutablePath: null
    clangIncludePaths: '.'
    clangSuppressWarnings: false
    clangDefaultCFlags: '-Wall'
    clangDefaultCppFlags: '-Wall'

  activate: ->
    console.log 'activate linter-clang'
