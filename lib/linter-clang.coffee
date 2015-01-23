{Range, Point, BufferedProcess, BufferedNodeProcess} = require 'atom'
linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"
path = require 'path'
fs = require 'fs'
# ClangFlags = require 'clang-flags'

class LinterClang extends Linter
  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: ['source.c++', 'source.c']

  # A string, list, tuple or callable that returns a string, list or tuple,
  # containing the command line (with arguments) used to lint.
  cmd: '-fsyntax-only -fno-caret-diagnostics'
  isCpp: false

  executablePath: null

  linterName: 'clang'

  errorStream: 'stderr'

  fileName: ''

  lintFile: (filePath, callback) ->
    # build the command with arguments to lint the file
    {command, args} = @getCmdAndArgs(filePath)

    # some flags

    if @isCpp
        args.push atom.config.get 'linter-clang.clangDefaultCppFlags'
    else
        args.push atom.config.get 'linter-clang.clangDefaultCFlags'

    args.push "-ferror-limit=#{atom.config.get 'linter-clang.clangErrorLimit'}"

    args.push '-w' if atom.config.get 'linter-clang.clangSuppressWarnings'

    # parse space separated string of includepaths relative to a directory, push to args
    parseIncludePaths: (relative_path, a_includepaths) ->
        # split the include paths by space taking care of quotes
        regex = /[^\s"]+|"([^"]*)"/gi
        includepathsSplit = []

        loop
            match = regex.exec includepaths
            if match
                includepathsSplit.push(if match[1] then match[1] else match[0])
            else
                break

        for ipath in includepathsSplit
            if ipath.length > 0
                # expand macro: directory of file being linted
                ipath = ipath.replace '%d', path.dirname @editor.getPath
                # expand macro: working directory
                ipath = ipath.replace '%w', @cwd
                ipath = ipath.replace '%%', '%'
                pathResolved = ipath.resolve(relative_path, ipath)
                args.push '-I'
                args.push pathResolved

    # filePath or what?
    parseIncludePaths filePath, atom.config.get 'linter-clang.clangIncludePaths'

    # this function searched a directory for include path files
    searchDirectory: (path) ->
        fs.readdirSync path, (err, list) =>
            for filename in list
                fs.statSync filename, (err, stat) =>
                    searchDirectory filename if file.isDirectory
                    if filename.isFile and filename is '.linter-clang-includes'
                        content = fs.readFileSync filename
                        # get rid of newlines
                        content = content.replace(/(\r\n|\n|\r)/gm, ' ')
                        parseIncludePaths path, content

    searchDirectory @cwd

    # add file to regex to filter output to this file,
    # need to change filename a bit to fit into regex
    @regex = filePath.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") +
        ':(?<line>\\d+):(?<col>\\d+): .*((?<error>error)|(?<warning>warning)): (?<message>.*)'

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
        console.log 'clang: stdout ', output
      if @errorStream == 'stdout'
        @processMessage(output, callback)

    stderr = (output) =>
      if atom.inDevMode()
        console.warn 'clang: stderr ', output
      if @errorStream == 'stderr'
        @processMessage(output, callback)

    if atom.inDevMode()
      console.log "clang command = #{command}, args = #{args}, options = #{options}"

    new Process({command, args, options, stdout, stderr})

  constructor: (editor) ->
    super(editor)
    if editor.getGrammar().name == 'C++'
      @cmd = 'clang++ ' + @cmd + ' -x c++ -std=c++11 -fcxx-exceptions'
      @grammar = '+'
      @isCpp = true
    if editor.getGrammar().name == 'C'
      @cmd = 'clang ' + @cmd + ' -x c -std=c11 -fexceptions'
      @grammar = 'c'

    @cmd+= ' -v' if atom.inDevMode()
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
