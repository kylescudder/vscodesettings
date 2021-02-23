'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const declarationInfo_1 = require("./declarationInfo");
class ModelParser {
    static getCompletionItems(position, document, workspaceRoot) {
        let declarationInfo = new declarationInfo_1.default(document, workspaceRoot, position);
        let userWantsSuggestions = declarationInfo.userWantsProperties();
        if (!userWantsSuggestions)
            return new Array();
        let model = declarationInfo.getCurrentModel();
        if (!model)
            return new Array();
        let namespaces = declarationInfo.getNamespaces();
        let properties = declarationInfo.getProperties(model, namespaces);
        if (!properties)
            return new Array();
        let suggestions = new Array();
        let items = declarationInfo.convertPropertiesToCompletionItems(properties);
        suggestions = suggestions.concat(items);
        return suggestions;
    }
    static getHoverResult(position, document, workspaceRoot) {
        let declarationInfo = new declarationInfo_1.default(document, workspaceRoot, position);
        let userWantsSingleProperty = declarationInfo.userWantsSingleProperty();
        if (!userWantsSingleProperty)
            return;
        let model = declarationInfo.getCurrentModel();
        if (!model)
            return;
        let namespaces = declarationInfo.getNamespaces();
        if (!model || !namespaces)
            return;
        let properties = declarationInfo.getProperties(model, namespaces);
        if (!properties)
            return;
        let word = declarationInfo.getWordAtPosition();
        properties = properties.filter(p => { return word === p.name; });
        if (properties.length == 0)
            return;
        let hover = declarationInfo.convertPropertiesToHoverResult(properties[0]);
        return hover;
    }
    static getModelErrors(document, workspaceRoot) {
        let declarationInfo = new declarationInfo_1.default(document, workspaceRoot);
        let model = declarationInfo.getCurrentModel();
        if (!model)
            return;
        let namespaces = declarationInfo.getNamespaces();
        let properties = declarationInfo.getProperties(model, namespaces);
        if (!properties)
            return;
        let usedProperties = declarationInfo.getAllUsedPropertiesInFile();
        if (!usedProperties)
            return;
        let diagnostics = [];
        usedProperties.forEach(u => {
            let isOkay = properties.find(p => { return p.name === u.property; });
            if (!isOkay) {
                let error = {
                    message: u.property + ' is not a property of ' + model,
                    severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                    source: 'ASP.NET Helper',
                    range: u.range
                };
                diagnostics.push(error);
            }
        });
        return diagnostics;
    }
}
exports.ModelParser = ModelParser;
//# sourceMappingURL=modelParser.js.map