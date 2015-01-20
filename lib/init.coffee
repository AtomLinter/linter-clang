module.exports =
  configDefaults:
    clangCommand: 'clang'
    clangExecutablePath: null
    clangIncludePaths: '.'
    clangSuppressWarnings: false
    clangDefaultCFlags: '-Wall'
    clangDefaultCppFlags: '-Wall'
    clangErrorLimit: 0
    clangCompleteFile: false

  activate: ->
    console.log 'activate linter-clang'
