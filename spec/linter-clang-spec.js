'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeEach, it } from 'jasmine-fix';
// Note, when testing if using fit you must import it!
import { join } from 'path';

const lint = require('../lib/main').provideLinter().lint;

const miPath = join(__dirname, 'files', 'missing_import');
const poPath = join(__dirname, 'files', 'pragma', 'pragma_once');
const validPath = join(__dirname, 'files', 'valid.c');
const multiRangePath = join(__dirname, 'files', 'multi-range.cpp');
const fixitPath = join(__dirname, 'files', 'fixit.hpp');
const otherPath = join(__dirname, 'files', 'otherFile');
const otherAPath = join(otherPath, 'a.cpp');
const otherBPath = join(otherPath, 'b.hpp');
const fileText = `// This is a comment, this will not return any errors.
#include "nothing.h"

int main(int argc, char const *argv[]) {
  /* code */
  return 0;
}
`;

describe('The Clang provider for AtomLinter', () => {
  beforeEach(async () => {
    await atom.packages.activatePackage('language-c');
    await atom.packages.activatePackage('linter-clang');
  });

  it('finds nothing wrong with a valid file', async () => {
    const editor = await atom.workspace.open(validPath);
    const messages = await lint(editor);
    expect(messages.length).toBe(0);
  });

  describe('handles errors in different file types', () => {
    it('finds a fatal error in "missing_import.c"', async () => {
      const editor = await atom.workspace.open(`${miPath}.c`);
      const messages = await lint(editor);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe("'nothing.h' file not found");
      expect(messages[0].location.file).toBe(`${miPath}.c`);
      expect(messages[0].location.position).toEqual([[1, 9], [1, 20]]);
    });

    it('finds a fatal error in "missing_import.cpp"', async () => {
      const editor = await atom.workspace.open(`${miPath}.cpp`);
      const messages = await lint(editor);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe("'nothing.h' file not found");
      expect(messages[0].location.file).toBe(`${miPath}.cpp`);
      expect(messages[0].location.position).toEqual([[1, 9], [1, 20]]);
    });

    it('finds a fatal error in "missing_import.m"', async () => {
      const editor = await atom.workspace.open(`${miPath}.m`);
      const messages = await lint(editor);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe("'nothing.h' file not found");
      expect(messages[0].location.file).toBe(`${miPath}.m`);
      expect(messages[0].location.position).toEqual([[1, 9], [1, 20]]);
    });

    it('finds a fatal error in "missing_import.mm"', async () => {
      const editor = await atom.workspace.open(`${miPath}.mm`);
      const messages = await lint(editor);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe("'nothing.h' file not found");
      expect(messages[0].location.file).toBe(`${miPath}.mm`);
      expect(messages[0].location.position).toEqual([[1, 9], [1, 20]]);
    });
  });

  describe('handles pragma once properly', () => {
    it('finds a pragma once warning in pragma_once.c', async () => {
      const editor = await atom.workspace.open(`${poPath}.c`);
      const messages = await lint(editor);
      expect(messages.length).toEqual(1);
      expect(messages[0].severity).toEqual('warning');
      expect(messages[0].excerpt).toEqual('#pragma once in main file [-Wpragma-once-outside-header]');
      expect(messages[0].location.file).toBe(`${poPath}.c`);
      expect(messages[0].location.position).toEqual([[0, 8], [0, 12]]);
    });

    it('finds a pragma once warning in pragma_once.cpp', async () => {
      const editor = await atom.workspace.open(`${poPath}.cpp`);
      const messages = await lint(editor);
      expect(messages.length).toEqual(1);
      expect(messages[0].severity).toEqual('warning');
      expect(messages[0].excerpt).toEqual('#pragma once in main file [-Wpragma-once-outside-header]');
      expect(messages[0].location.file).toBe(`${poPath}.cpp`);
      expect(messages[0].location.position).toEqual([[0, 8], [0, 12]]);
    });

    it("doesn't find a pragma once warning in pragma_once.h", async () => {
      const editor = await atom.workspace.open(`${poPath}.h`);
      const messages = await lint(editor);
      expect(messages.length).toEqual(0);
    });

    it("doesn't find a pragma once warning in pragma_once.hpp", async () => {
      const editor = await atom.workspace.open(`${poPath}.hpp`);
      const messages = await lint(editor);
      expect(messages.length).toEqual(0);
    });
  });

  it('works on a modified file', async () => {
    // Open the valid file
    const editor = await atom.workspace.open(validPath);
    // Set the text to invalid text
    editor.setText(fileText);
    // Lint the editor
    const messages = await lint(editor);
    expect(messages.length).toBe(1);
    expect(messages[0].severity).toBe('error');
    expect(messages[0].excerpt).toBe("'nothing.h' file not found");
    expect(messages[0].location.file).toBe(validPath);
    expect(messages[0].location.position).toEqual([[1, 9], [1, 20]]);
  });

  it('handles multiple ranges', async () => {
    const editor = await atom.workspace.open(multiRangePath);
    const messages = await lint(editor);
    expect(messages.length).toBe(1);
    expect(messages[0].severity).toBe('error');
    expect(messages[0].excerpt).toBe("invalid operands to binary expression ('double' and 'double')");
    expect(messages[0].location.file).toBe(multiRangePath);
    expect(messages[0].location.position).toEqual([[3, 15], [3, 24]]);
  });

  it('handles suggested fixes', async () => {
    const editor = await atom.workspace.open(fixitPath);
    const messages = await lint(editor);
    expect(messages.length).toBe(1);
    expect(messages[0].severity).toBe('warning');
    expect(messages[0].excerpt).toBe('extra tokens at end of #endif directive [-Wextra-tokens]');
    expect(messages[0].location.file).toBe(fixitPath);
    expect(messages[0].location.position).toEqual([[3, 7], [3, 14]]);
    expect(messages[0].solutions.length).toBe(1);
    expect(messages[0].solutions[0].position).toEqual([[3, 7], [3, 7]]);
    expect(messages[0].solutions[0].replaceWith).toBe('//');
  });

  describe('handles messages in other files', () => {
    it('without another editor open', async () => {
      const editorA = await atom.workspace.open(otherAPath);
      const messages = await lint(editorA);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe("invalid '+=' at end of declaration; did you mean '='?");
      expect(messages[0].location.file).toBe(otherBPath);
      expect(messages[0].location.position).toEqual([[2, 8], [2, 9]]);
    });

    it('with another editor open', async () => {
      const editorA = await atom.workspace.open(otherAPath);
      await atom.workspace.open(otherBPath);
      const messages = await lint(editorA);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe("invalid '+=' at end of declaration; did you mean '='?");
      expect(messages[0].location.file).toBe(otherBPath);
      expect(messages[0].location.position).toEqual([[2, 8], [2, 12]]);
    });
  });
});
