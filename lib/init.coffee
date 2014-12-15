module.exports =
  configDefaults:
    clangCommand: 'clang'
    clangPlusPlusCommand: 'clang++'
    clangExecutablePath: null
    clangIncludePath: '.'
    clangSuppressWarnings: false
    clangDefaultCFlags: '-Wall'
    clangDefaultCppFlags: '-Wall'

  activate: ->
    console.log 'activate linter-clang'
