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

  @cmd: ''

  errorStream: 'stderr'

  lintFile: (filePath, callback) ->
    # parse space separated string
    parseSpaceString = (string) ->
      # split the include paths by space taking care of quotes
      regex = /[^\s"]+|"([^"]*)"/gi
      stringSplit = []

      loop
        match = regex.exec string
        if match
          stringSplit.push(if match[1] then match[1] else match[0])
        else
          break

      return stringSplit

    @cmd = atom.config.get 'linter-clang.clangCommand'

    {command, args} = @getCmdAndArgs(filePath)

    args.push '-fsyntax-only'
    args.push '-fno-caret-diagnostics'
    args.push '-fexceptions'
    args.push "-x#{@language}"

    flagSplit = parseSpaceString switch @editor.getGrammar().name
        when 'C++'           then atom.config.get 'linter-clang.clangDefaultCppFlags'
        when 'Objective-C++' then atom.config.get 'linter-clang.clangDefaultObjCppFlags'
        when 'C'             then atom.config.get 'linter-clang.clangDefaultCFlags'
        when 'Objective-C'   then atom.config.get 'linter-clang.clangDefaultObjCFlags'

    for customflag in flagSplit
      if customflag.length > 0
        args.push customflag

    args.push "-ferror-limit=#{atom.config.get 'linter-clang.clangErrorLimit'}"
    args.push '-w' if atom.config.get 'linter-clang.clangSuppressWarnings'

    if atom.config.get 'linter-clang.clangCompleteFile'
      args.push ClangFlags.getClangFlags(@editor.getPath()).join

    includePath = (base, pathArray, args) ->
      for ipath in pathArray
        if ipath.length > 0
          pathResolved = path.resolve(base, ipath)
          args.push '-I'
          args.push pathResolved

    pathArray =
      parseSpaceString atom.config.get 'linter-clang.clangIncludePaths'

    includePath @cwd, pathArray, args

    # this function searched a directory for include path files
    searchDirectory = (base, args) ->
      list = fs.readdirSync base
      for filename in list
        stat = fs.statSync path.resolve(base, filename)
        if stat.isDirectory()
          searchDirectory path.resolve(base, filename), args
        if stat.isFile() and filename is '.linter-clang-includes'
          content = fs.readFileSync path.resolve(base, filename), 'utf8'
          content = content.split("\n");
          includePath base, content, args

    searchDirectory @cwd, args

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

    if atom.inDevMode()
      console.log "clang: command = #{command}, args = #{args}, options = #{options}"

    new Process({command, args, options, stdout, stderr})

  constructor: (editor) ->
    @editor = editor

    if editor.getGrammar().name == 'C++'
      @language = 'c++'
      # @flag = '-std=c++11'
    if editor.getGrammar().name == 'Objective-C++'
      @language = 'objective-c++'
      # @flag = ''
    if editor.getGrammar().name == 'C'
      @language = 'c'
      # @flag = ''
    if editor.getGrammar().name == 'Objective-C'
      @language = 'objective-c'
      # @flag = ''

    super(editor)

  createMessage: (match) ->
    # message might be empty, we have to supply a value
    if match and match.type == 'parse' and not match.message
      message = 'error'

    super(match)

module.exports = LinterClang
