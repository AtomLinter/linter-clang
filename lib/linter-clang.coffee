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
  cmd: '-fsyntax-only -fno-caret-diagnostics -fexceptions'
  isCpp: false
  clang: null

  executablePath: null

  editor: null

  linterName: 'clang'

  errorStream: 'stderr'

  fileName: ''

  lintFile: (filePath, callback) ->
    # save cmd to oldCmd
    oldCmd = @cmd

    @clang = atom.config.get 'linter-clang.clangCommand'
    if atom.inDevMode()
      console.log 'clang-command: ' + @clang

    @cmd = "#{@clang} #{@cmd} -x #{@language}"

    if @isCpp
      @cmd += ' ' + atom.config.get 'linter-clang.clangDefaultCppFlags'
    else
      @cmd += ' ' + atom.config.get 'linter-clang.clangDefaultCFlags'

    @cmd += ' -ferror-limit=' + atom.config.get 'linter-clang.clangErrorLimit'

    if atom.config.get 'linter-clang.clangCompleteFile'
      @cmd += ' ' + ClangFlags.getClangFlags(@editor.getPath()).join ' '

    @cmd += ' -I' + @editor.getPath().replace(/(.*)\/.*/, '$1')

    includepaths = atom.config.get 'linter-clang.clangIncludePaths'

    # read other include paths from file in project
    filename = path.resolve(atom.project.getPaths()[0], '.linter-clang-includes')
    if fs.existsSync filename
      file = fs.readFileSync filename, 'utf8'
      file = file.replace(/(\r\n|\n|\r)/gm, ' ')
      includepaths = "#{includepaths} #{file}"

    split = includepaths.split " "

    # concat includepath
    for custompath in split
      if custompath.length > 0
        @cmd = "#{@cmd} -I#{custompath}"
        # if the path is relative, resolve it
        # TODO: if path contain blank space!!!
        # custompathResolved = path.resolve(atom.project.getPaths()[0], custompath)
        # custompathResolved = custompathResolved.replace(/\ /g, '\\ ')
        # @cmd = "#{@cmd} -I #{custompathResolved}"

    if atom.config.get 'linter-clang.clangSuppressWarnings'
      @cmd = "#{@cmd} -w"
    # build the command with arguments to lint the file
    {command, args} = @getCmdAndArgs(filePath)

    # add file to regex to filter output to this file,
    # need to change filename a bit to fit into regex
    @regex = filePath.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") +
    ':(?<line>\\d+):.+: .*((?<error>error)|(?<warning>warning)): (?<message>.*)'

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

    if atom.inDevMode()
      console.log "command = #{command}, args = #{args}, options = #{options}"

    new Process({command, args, options, stdout, stderr})

    # restore cmd
    @cmd = oldCmd

  constructor: (editor) ->
    @editor = editor

    if editor.getGrammar().name == 'C++'
      @language = 'c++ -std=c++11'
      @isCpp = true
    if editor.getGrammar().name == 'Objective-C++'
      @language = 'objective-c++'
      @isCpp = true
    if editor.getGrammar().name == 'C'
      @language = 'c -std=c11'
      @isCpp = false
    if editor.getGrammar().name == 'Objective-C'
      @language = 'objective-c'
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
