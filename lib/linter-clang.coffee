module.exports = LinterClang =
  config:
    command:
      type: 'string'
      default: 'clang'
    includePaths:
      type: 'string'
      default: '.'
    suppressWarnings:
      type: 'boolean'
      default: false
    defaultCFlags:
      type: 'string'
      default: '-Wall'
    defaultCppFlags:
      type: 'string'
      default: '-Wall -std=c++11'
    defaultObjCFlags:
      type: 'string'
      default: ' '
    defaultObjCppFlags:
      type: 'string'
      default: ' '
    errorLimit:
      type: 'integer'
      default: 0
    verboseDebug:
      type: 'boolean'
      default: false

  activate: ->
    console.log 'activate linter-clang' if atom.inDevMode()
    unless atom.packages.getLoadedPackages 'linter-plus'
      @showError '[linter-clang] `linter-plus` package not found, please install it'

  showError: (message = '') ->
    atom.notifications.addError message

  provideLinter: ->
    {
      scopes: ['source.c', 'source.cpp', 'source.objc', 'source.objcpp']
      scope: 'file'
      lint: @lint
      lintOnFly: false
    }

  lint: (TextEditor, TextBuffer) ->
    CP = require 'child_process'
    Path = require 'path'
    XRegExp = require('xregexp').XRegExp

    regex = XRegExp('(?<file>.+):(?<line>\\d+):(?<col>\\d+):(\{(?<lineStart>\\d+):(?<colStart>\\d+)\\-(?<lineEnd>\\d+):(?<colEnd>\\d+)\}.*:)? ((?<error>(?:fatal )?error)|(?<warning>warning)): (?<message>.*)')

    return new Promise (Resolve) ->
      filePath = TextEditor.getPath()
      if filePath # Files that have not be saved
        if TextEditor.getGrammar().name == 'C++'
          @language = 'c++'
        if TextEditor.getGrammar().name == 'Objective-C++'
          @language = 'objective-c++'
        if TextEditor.getGrammar().name == 'C'
          @language = 'c'
        if TextEditor.getGrammar().name == 'Objective-C'
          @language = 'objective-c'

        cmd = atom.config.get 'linter-clang.command'
        cmd = "#{cmd} -fsyntax-only"
        cmd = "#{cmd} -fno-caret-diagnostics"
        cmd = "#{cmd} -fno-diagnostics-fixit-info"
        cmd = "#{cmd} -fdiagnostics-print-source-range-info"
        cmd = "#{cmd} -fexceptions"
        cmd = "#{cmd} -x#{@language}"
        cmd = "#{cmd} #{Path.basename(filePath)}"
        Data = []

        Process = CP.exec(cmd, {cwd: Path.dirname(filePath)})
        Process.stderr.on 'data', (data) -> Data.push(data.toString())
        Process.on 'close', ->
          Content = []
          for line in Data
            Content.push XRegExp.exec(line, regex)
            console.log line if atom.inDevMode()
          ToReturn = []
          Content.forEach (regex) ->
            if regex
              if regex.error
                ToReturn.push(
                  type: 'error',
                  message: regex.message,
                  file: filePath
                  position: [[regex.line, regex.column], [regex.line, regex.column]]
                )
              if regex.warning
                ToReturn.push(
                  type: 'warning',
                  message: regex.message,
                  file: filePath
                  position: [[regex.line, regex.col], [regex.line, regex.col]]
                )
          Resolve(ToReturn)
