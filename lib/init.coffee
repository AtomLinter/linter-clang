module.exports =
  configDefaults:
    clangExecutablePath: null
    clangIncludePath: '.'
    clangSuppressWarnings: false

  activate: ->
    console.log 'activate linter-clang'
