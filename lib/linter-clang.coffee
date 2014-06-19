linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"
path = require 'path'

class LinterClang extends Linter
  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: ['source.c++']

  # A string, list, tuple or callable that returns a string, list or tuple,
  # containing the command line (with arguments) used to lint.
  cmd: 'clang++ -cc1 -fsyntax-only -fno-caret-diagnostics -fcxx-exceptions -Wall -I' + path.dirname()

  executablePath: null

  linterName: 'clang'

  errorStream: 'stderr'

  # A regex pattern used to extract information from the executable's output.
  regex: '.+:(?<line>\\d+):.+: .*((?<error>error)|(?<warning>warning)): (?<message>.*)'

  constructor: (editor) ->
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
