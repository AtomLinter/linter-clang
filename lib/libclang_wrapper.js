"use babel";

import ref from "ref"
const libclang = require("../node_modules/libclang/lib/dynamic_clang").libclang

export default class LibClangWrapper {
  constructor(file, options) {
    console.log(`LibClang file: ${file}`)
    console.log(`LibClang options: ${options}`)
    console.log(libclang)
    self.index = libclang.clang_createIndex(0, 0)
    console.log(index);
    self.translation_unit = libclang.clang_parseTranslationUnit(index, file, null, null, null, null, libclang.CXTranslationUnit_None)
    console.log(translation_unit);
  }

  get_diagnostics() {
    const results = []
    const diagnostics = libclang.clang_getNumDiagnostics(self.translation_unit)
    for (var i = 0; i < diagnostics; i++) {
      const diagnostic = libclang.clang_getDiagnostic(self.translation_unit, i)
      const text = libclang.clang_getCString(libclang.clang_getDiagnosticSpelling(diagnostic))
      const category = libclang.clang_getCString(libclang.clang_getDiagnosticCategoryText(diagnostic))
      let severity
      switch (libclang.clang_getDiagnosticSeverity(diagnostic)) {
        case 0: //CXDiagnostic_Ignored
          severity = "ignored"
          break
        case 1: //CXDiagnostic_Note
          severity = "note"
          break
        case 2: //CXDiagnostic_Warning
          severity = "warning"
          break
        case 3: //CXDiagnostic_Error
          severity = "error"
          break
        case 4: //CXDiagnostic_Fatal
          severity = "fatal error"
          break
      }
      let file = ref.alloc('pointer')
      let startColumn = ref.alloc('uint')
      let endColumn = ref.alloc('uint')
      let startLine = ref.alloc('uint')
      let endLine = ref.alloc('uint')
      const ranges = libclang.clang_getDiagnosticNumRanges(diagnostic)
      for (var j = 0; j < ranges.length; j++) {
        const range = libclang.clang_getDiagnosticRange(diagnostic, j)
        const start = libclang.clang_getRangeStart(range)
        libclang.clang_getSpellingLocation(start, file, startLine, startColumn, null)
        const end = libclang.clang_getRangeEnd(range)
        libclang.clang_getSpellingLocation(end, null, endLine, endLine, null)
      }
      console.log(file);
      console.log(file.deref());
      console.log(file.deref().deref());
      console.log(libclang.clang_getCString(libclang.clang_getFileName(file)));
      console.log(startLine.deref());
      console.log(startColumn.deref());
      console.log(endLine.deref());
      console.log(endColumn.deref());
      results.push({
        type: severity,
        text: text,
        range: [
          [startLine.deref(), startColumn.deref()],
          [endLine.deref(), endColumn.deref()]
        ],
        filePath: libclang.clang_getCString(libclang.clang_getFileName(file.deref()))
      })
      libclang.clang_disposeDiagnostic(diagnostic)
    }
    console.log(results);
    return(results)
  }

  dispose() {
    libclang.clang_disposeTranslationUnit(self.translation_unit)
    libclang.clang_disposeIndex(self.index)
  }
}
