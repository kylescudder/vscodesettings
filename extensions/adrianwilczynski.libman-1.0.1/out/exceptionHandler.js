"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function handle(action) {
    return (uri) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield action(uri);
        }
        catch (err) {
            if (err instanceof Error && err.message) {
                vscode.window.showErrorMessage(`LibMan extension encountered an error: "${err.message}".`);
            }
        }
    });
}
exports.handle = handle;
//# sourceMappingURL=exceptionHandler.js.map