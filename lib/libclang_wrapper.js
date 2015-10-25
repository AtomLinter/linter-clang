"use babel";

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
      results.push({
        type: severity,
        text: text
      })
    }
    return(results)
  }

  dispose() {
    libclang.clang_disposeTranslationUnit(self.translation_unit)
    libclang.clang_disposeIndex(self.index)
  }
}
