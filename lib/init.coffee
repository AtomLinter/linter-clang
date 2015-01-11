module.exports =
  configDefaults:
    clangExecutablePath: null
    clangIncludePaths: '.'
    clangSuppressWarnings: false
    clangDefaultCFlags: '-Wall'
    clangDefaultCppFlags: '-Wall'
    clangErrorLimit: 0

  activate: ->
    console.log 'activate linter-clang'
