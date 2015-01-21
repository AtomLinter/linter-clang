{Range, Point, BufferedProcess, BufferedNodeProcess} = require 'atom'
linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"
path = require 'path'
fs = require 'fs'
ClangFlags = require 'clang-flags'

class LinterClang extends Linter
  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: ['source.c++', 'source.cpp', 'source.c', 'source.objc++',
  'source.objcpp', 'source.objc']

  # A string, list, tuple or callable that returns a string, list or tuple,
  # containing the command line (with arguments) used to lint.

  isCpp: false
  clang: null
  @cmd: ''

  executablePath: null

  editor: null

  linterName: 'clang'

  errorStream: 'stderr'

  fileName: ''

  lintFile: (filePath, callback) ->
    @cmd = 'clang -fsyntax-only -fno-caret-diagnostics -fexceptions'

    {command, args} = @getCmdAndArgs(filePath)
    @fileName = args[3]
    args[3] = ''

    command = @clang = atom.config.get 'linter-clang.clangCommand'
    if atom.inDevMode()
      console.log 'clang-command: ' + @clang

    args.push '-x'
    args.push @language

    if @isCpp
      flag = atom.config.get 'linter-clang.clangDefaultCppFlags'
    else
      flag = atom.config.get 'linter-clang.clangDefaultCFlags'

    regex = /[^\s"]+|"([^"]*)"/gi
    flagSplit = []

    loop
      match = regex.exec flag
      if match
        flagSplit.push(if match[1] then match[1] else match[0])
      else
        break

    for customflag in flagSplit
      if customflag.length > 0
        args.push customflag

    args.push "-ferror-limit=#{atom.config.get 'linter-clang.clangErrorLimit'}"
    args.push '-w' if atom.config.get 'linter-clang.clangSuppressWarnings'

    if atom.config.get 'linter-clang.clangCompleteFile'
      args.push ClangFlags.getClangFlags(@editor.getPath()).join

    includepaths = atom.config.get 'linter-clang.clangIncludePaths'

    # read other include paths from file in project
    filename = path.resolve(atom.project.getPaths()[0], '.linter-clang-includes')
    if fs.existsSync filename
      file = fs.readFileSync filename, 'utf8'
      file = file.replace(/(\r\n|\n|\r)/gm, ' ')
      includepaths = "#{includepaths} #{file}"

    #split = includepaths.split " "
    # split the include paths, taking care of quotes
    regex = /[^\s"]+|"([^"]*)"/gi
    includepathsSplit = []

    loop
      match = regex.exec includepaths
      if match
        includepathsSplit.push(if match[1] then match[1] else match[0])
      else
        break

    # add includepaths
    for custompath in includepathsSplit
      if custompath.length > 0
        custompathResolved = path.resolve(atom.project.getPaths()[0], custompath)
        args.push '-I'
        args.push custompathResolved

    # add file to regex to filter output to this file,
    # need to change filename a bit to fit into regex
    @regex = filePath.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") +
    ':(?<line>\\d+):.+: .*((?<error>error)|(?<warning>warning)): (?<message>.*)'

    if atom.inDevMode()
      console.log 'linter-clang: is node executable: ' + @isNodeExecutable

    # use BufferedNodeProcess if the linter is node executable
    if @isNodeExecutable
      Process = BufferedNodeProcess
    else
      Process = BufferedProcess

    # options for BufferedProcess, same syntax with child_process.spawn
    options = {cwd: @cwd}

    stdout = (output) =>
      if atom.inDevMode()
        console.log 'clang: stdout', output
      if @errorStream == 'stdout'
        @processMessage(output, callback)

    stderr = (output) =>
      if atom.inDevMode()
        console.warn 'clang: stderr', output
      if @errorStream == 'stderr'
        @processMessage(output, callback)

    args.push @fileName

    if atom.inDevMode()
      console.log "clang: command = #{command}, args = #{args}, options = #{options}"

    new Process({command, args, options, stdout, stderr})

    # restore cmd
    # @cmd = oldCmd

  constructor: (editor) ->
    @editor = editor

    if editor.getGrammar().name == 'C++'
      @language = 'c++'
      # @flag = '-std=c++11'
      @isCpp = true
    if editor.getGrammar().name == 'Objective-C++'
      @language = 'objective-c++'
      # @flag = ''
      @isCpp = true
    if editor.getGrammar().name == 'C'
      @language = 'c'
      # @flag = ''
      @isCpp = false
    if editor.getGrammar().name == 'Objective-C'
      @language = 'objective-c'
      # @flag = ''
      @isCpp = false

    super(editor)

    atom.config.observe 'linter-clang.clangExecutablePath', =>
      @executablePath = atom.config.get 'linter-clang.clangExecutablePath'

  destroy: ->
    atom.config.unobserve 'linter-clang.clangExecutablePath'

  createMessage: (match) ->
    # message might be empty, we have to supply a value
    if match and match.type == 'parse' and not match.message
      message = 'error'

    super(match)

module.exports = LinterClang
