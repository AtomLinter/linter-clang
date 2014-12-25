{Range, Point, BufferedProcess, BufferedNodeProcess} = require 'atom'
linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"
path = require 'path'
fs = require 'fs'
# ClangFlags = require 'clang-flags'

class LinterClang extends Linter
  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: ['source.c++', 'source.cpp', 'source.c']

  # A string, list, tuple or callable that returns a string, list or tuple,
  # containing the command line (with arguments) used to lint.
  cmd: '-fsyntax-only -fno-caret-diagnostics'
  isCpp: false

  executablePath: null

  linterName: 'clang'

  errorStream: 'stderr'

  fileName: ''

  # A regex pattern used to extract information from the executable's output.
  regex: '.+:(?<line>\\d+):.+: .*((?<error>error)|(?<warning>warning)): ' +
         '(?<message>.*)'

  lintFile: (filePath, callback) ->
    # save cmd to tmp
    tmp = @cmd

    if @isCpp
      @cmd += ' ' + atom.config.get 'linter-clang.clangDefaultCppFlags'
    else
      @cmd += ' ' + atom.config.get 'linter-clang.clangDefaultCFlags'

    includepaths = atom.config.get 'linter-clang.clangIncludePaths'

    # read other include paths from file in project
    filename = atom.project.getPaths()[0] + '/.linter-clang-includes'
    if fs.existsSync filename
        file = fs.readFileSync filename, 'utf8'
        includepaths = "#{includepaths} #{file.replace('\n', ' ')}"

    split = includepaths.split " "

    # concat includepath
    for custompath in split
      if custompath.length > 0
        @cmd = "#{@cmd} -I #{custompath}"
    if atom.config.get 'linter-clang.clangSuppressWarnings'
      @cmd = "#{@cmd} -w"
    # build the command with arguments to lint the file
    {command, args} = @getCmdAndArgs(filePath)

    file = path.basename(args[args.length - 1])
    if file[file.length - 1] == @grammar
      file = file.replace(".", "\\.")
      file = file.replace("++", "\\+\\+")
      @regex = file + ':(?<line>\\d+):.+: .*((?<error>error)|' +
                      '(?<warning>warning)): (?<message>.*)'

    if atom.inDevMode()
      console.log 'is node executable: ' + @isNodeExecutable

    # use BufferedNodeProcess if the linter is node executable
    if @isNodeExecutable
      Process = BufferedNodeProcess
    else
      Process = BufferedProcess

    # options for BufferedProcess, same syntax with child_process.spawn
    options = {cwd: @cwd}

    stdout = (output) =>
      if atom.inDevMode()
        console.log 'stdout', output
      if @errorStream == 'stdout'
        @processMessage(output, callback)

    stderr = (output) =>
      if atom.inDevMode()
        console.warn 'stderr', output
      if @errorStream == 'stderr'
        @processMessage(output, callback)

    new Process({command, args, options, stdout, stderr})
    #restore cmd
    @cmd = tmp;

  constructor: (editor) ->
    super(editor)
    if editor.getGrammar().name == 'C++'
      @cmd = "#{atom.config.get 'linter-clang.clangPlusPlusCommand'} "  + @cmd + ' -x c++ -std=c++11 -fcxx-exceptions'
      @grammar = '+'
      @isCpp = true
    if editor.getGrammar().name == 'C'
      @cmd = "#{atom.config.get 'linter-clang.clangCommand'} " + @cmd + ' -x c -std=c11 -fexceptions'
      @grammar = 'c'

    # @cmd += ' ' + ClangFlags.getClangFlags(editor.getPath()).join ' '

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
