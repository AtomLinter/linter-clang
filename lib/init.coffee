module.exports =
  config:
    clangCommand:
      type: 'string'
      default: 'clang'
    clangIncludePaths:
      type: 'string'
      default: '.'
    clangSuppressWarnings:
      type: 'boolean'
      default: false
    clangDefaultCFlags:
      type: 'string'
      default: '-Wall'
    clangDefaultCppFlags:
      type: 'string'
      default: '-Wall -std=c++11'
    clangDefaultObjCFlags:
      type: 'string'
      default: ' '
    clangDefaultObjCppFlags:
      type: 'string'
      default: ' '
    clangErrorLimit:
      type: 'integer'
      default: 0
    verboseDebug:
      type: 'boolean'
      default: false

  activate: ->
    console.log 'activate linter-clang' if atom.inDevMode()
