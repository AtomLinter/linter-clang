'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeEach, it } from 'jasmine-fix';
import { join } from 'path';

const lint = require('../lib/main').provideLinter().lint;

const miPath = join(__dirname, 'files', 'missing_import');
const validPath = join(__dirname, 'files', 'valid.c');

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
      expect(messages[0].location.position).toEqual([[1, 9], [1, 17]]);
    });

    it('finds a fatal error in "missing_import.cpp"', async () => {
      const editor = await atom.workspace.open(`${miPath}.cpp`);
      const messages = await lint(editor);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe("'nothing.h' file not found");
      expect(messages[0].location.file).toBe(`${miPath}.cpp`);
      expect(messages[0].location.position).toEqual([[1, 9], [1, 17]]);
    });

    it('finds a fatal error in "missing_import.m"', async () => {
      const editor = await atom.workspace.open(`${miPath}.m`);
      const messages = await lint(editor);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe("'nothing.h' file not found");
      expect(messages[0].location.file).toBe(`${miPath}.m`);
      expect(messages[0].location.position).toEqual([[1, 9], [1, 17]]);
    });

    it('finds a fatal error in "missing_import.mm"', async () => {
      const editor = await atom.workspace.open(`${miPath}.mm`);
      const messages = await lint(editor);
      expect(messages.length).toBe(1);
      expect(messages[0].severity).toBe('error');
      expect(messages[0].excerpt).toBe("'nothing.h' file not found");
      expect(messages[0].location.file).toBe(`${miPath}.mm`);
      expect(messages[0].location.position).toEqual([[1, 9], [1, 17]]);
    });
  });
});
