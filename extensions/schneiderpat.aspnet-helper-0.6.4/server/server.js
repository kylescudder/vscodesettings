'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const tagHelperParser_1 = require("./features/tagHelper/tagHelperParser");
const modelParser_1 = require("./features/model/modelParser");
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
let documents = new vscode_languageserver_1.TextDocuments();
documents.listen(connection);
let workspaceRoot;
connection.onInitialize((params) => {
    if (params.rootPath)
        workspaceRoot = params.rootPath;
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', '"', '-']
            },
            hoverProvider: true
        }
    };
});
let maxNumberOfProblems;
connection.onDidChangeConfiguration((change) => {
    let settings = change.settings;
    maxNumberOfProblems = settings.razorServer.maxNumberOfProblems || 100;
});
connection.onHover((textDocumentPosition) => {
    let document = documents.get(textDocumentPosition.textDocument.uri);
    let hoverResult = modelParser_1.ModelParser.getHoverResult(textDocumentPosition.position, document, workspaceRoot);
    if (hoverResult)
        return hoverResult;
    let hover = {
        contents: ''
    };
    return hover;
});
connection.onCompletion((textDocumentPosition) => {
    let items = new Array();
    let document = documents.get(textDocumentPosition.textDocument.uri);
    let tagHelperItems = tagHelperParser_1.TagHelperParser.getCompletionItems(textDocumentPosition.position, document, workspaceRoot);
    if (tagHelperItems)
        items = items.concat(tagHelperItems);
    let modelItems = modelParser_1.ModelParser.getCompletionItems(textDocumentPosition.position, document, workspaceRoot);
    if (modelItems)
        items = items.concat(modelItems);
    return items;
});
connection.onCompletionResolve((item) => {
    return item;
});
documents.onDidChangeContent((change) => {
    let errors = modelParser_1.ModelParser.getModelErrors(change.document, workspaceRoot);
    if (!errors)
        return;
    let publishErrors = {
        diagnostics: errors,
        uri: change.document.uri
    };
    if (publishErrors) {
        connection.sendDiagnostics(publishErrors);
    }
});
connection.listen();
//# sourceMappingURL=server.js.map