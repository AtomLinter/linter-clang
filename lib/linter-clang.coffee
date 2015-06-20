child_process = require 'child_process'
path = require 'path'

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
    unless atom.packages.getLoadedPackages 'linter-plus'
      atom.notifications.addError '[linter-clang] `linter-plus` package not found, please install it'

  provideLinter: -> {
    grammarScopes: ['source.c', 'source.cpp', 'source.objc', 'source.objcpp']
    scope: 'file'
    lint: @lint
    lintOnFly: false
  }

  lint: (TextEditor) ->
    regex = ///
      (.+): #File with issue
      (\d+): #Line with issue
      (\d+):\s #Column with issue
      (.+):\s+ #Type of issue
      (.*) #Message explaining issue
    ///
    return new Promise (Resolve) ->
      filePath = TextEditor.getPath()
      if filePath # Files that have not be saved
        file = path.basename(filePath)
        cwd = path.dirname(filePath)
        @language = 'c++' if TextEditor.getGrammar().name == 'C++'
        @language = 'objective-c++' if TextEditor.getGrammar().name == 'Objective-C++'
        @language = 'c' if TextEditor.getGrammar().name == 'C'
        @language = 'objective-c' if TextEditor.getGrammar().name == 'Objective-C'

        cmd = atom.config.get 'linter-clang.command'
        cmd = "#{cmd} -fsyntax-only"
        cmd = "#{cmd} -fno-caret-diagnostics"
        cmd = "#{cmd} -fno-diagnostics-fixit-info"
        cmd = "#{cmd} -fdiagnostics-print-source-range-info"
        cmd = "#{cmd} -fexceptions"
        cmd = "#{cmd} -x#{@language}"
        cmd = "#{cmd} #{file}"
        console.log "linter-clang command: #{cmd}" if atom.inDevMode()
        data = []
        process = child_process.exec(cmd, {cwd: path.dirname(filePath)})
        process.stderr.on 'data', (d) -> data.push d.toString()
        process.on 'close', ->
          toReturn = []
          for line in data
            console.log "linter-clang command output: #{line}" if atom.inDevMode()
            if line.match regex
              [file, line, column, type, message] = line.match(regex)[1..5]
              toReturn.push(
                type: type,
                text: message,
                filePath: path.join(cwd, file).normalize()
                range: [[line - 1, column - 1], [line - 1, column - 1]]
              )
          Resolve(toReturn)
