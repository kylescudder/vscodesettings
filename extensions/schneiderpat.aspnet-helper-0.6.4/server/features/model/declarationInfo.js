"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const parsingResults_1 = require("../parsingResults");
class ModelDeclarationInfo {
    constructor(document, workspaceRoot, position) {
        this._document = document;
        this.getRootPath();
        if (position) {
            this._position = position;
            this.setInput();
        }
    }
    setInput() {
        let lines = this._document.getText().split(/\r?\n/g);
        this.input = lines[this._position.line].substr(0, this._position.character);
    }
    getCurrentLine() {
        let lines = this._document.getText().split(/\r?\n/g);
        return lines[this._position.line];
    }
    getWordAtPosition() {
        let line = this.getCurrentLine();
        let left = line.slice(0, this._position.character + 1).search(/\./);
        let right = line.slice(left + 1).search(/\W/);
        if (right < 0)
            return line.slice(left);
        return line.slice(left + 1, right + this._position.character - 2);
    }
    getRootPath() {
        let currentDir = vscode_languageserver_1.Files.uriToFilePath(this._document.uri);
        if (!currentDir)
            return;
        while (currentDir !== this._rootDir) {
            currentDir = path.dirname(currentDir);
            fs.readdirSync(currentDir).forEach(f => {
                if (f.includes('project.json') || f.includes('csproj')) {
                    if (currentDir)
                        this._rootDir = currentDir;
                    return;
                }
            });
        }
    }
    userWantsProperties() {
        let userRegExp = /.*@Model\.?$/;
        if (userRegExp.test(this.input))
            return true;
        return false;
    }
    userWantsSingleProperty() {
        let userRegExp = /.*@Model\.\w*$/;
        if (userRegExp.test(this.input))
            return true;
        return false;
    }
    getCurrentModel() {
        let firstLine = this._document.getText().split(/\r?\n/g)[0];
        let modelRegExp = /.?model\s(.*)$/;
        let model = parsingResults_1.GetParts(firstLine, modelRegExp);
        if (model)
            return model[1];
        return '';
    }
    getNamespaces() {
        let files = this.getViewImportsFiles();
        let namespaces = this.getNamespacesFromFiles(files);
        return namespaces;
    }
    getViewImportsFiles() {
        let currentDir = vscode_languageserver_1.Files.uriToFilePath(this._document.uri);
        if (!currentDir)
            return [];
        let files = [];
        while (currentDir !== this._rootDir) {
            currentDir = path.dirname(currentDir);
            fs.readdirSync(currentDir).forEach(f => {
                if (f.includes('_ViewImports.cshtml'))
                    files.push(currentDir + path.sep + f);
            });
        }
        return files;
    }
    getNamespacesFromFiles(files) {
        let namespaces = [];
        let namespaceRegExp = /@using\s(.*)/g;
        files.forEach(f => {
            let text = fs.readFileSync(f, 'utf8');
            let results = text.match(namespaceRegExp);
            if (results) {
                results.forEach(r => {
                    let namespace = parsingResults_1.GetParts(r, new RegExp(namespaceRegExp.source));
                    if (namespace)
                        namespaces.push(namespace[1]);
                });
            }
        });
        return namespaces;
    }
    getProperties(model, namespaces) {
        let matchingFiles = this.getMatchingFiles(model, namespaces);
        if (matchingFiles.length == 0)
            return new Array();
        let text = fs.readFileSync(matchingFiles[0], 'utf8');
        let propRegExp = /public\s(?:virtual\s)?(\w*<?\w+>?\??)\s(\w+)/g;
        let fullProps = text.match(propRegExp);
        if (!fullProps)
            return new Array();
        fullProps = fullProps.filter(f => !f.includes('class'));
        let items = new Array();
        fullProps.forEach(p => {
            let results = parsingResults_1.GetParts(p, new RegExp(propRegExp.source));
            if (!results)
                return;
            let item = new parsingResults_1.Property();
            item.type = results[1];
            item.name = results[2];
            items.push(item);
        });
        return items;
    }
    convertPropertiesToCompletionItems(properties) {
        let items = new Array();
        properties.forEach(p => {
            let item = vscode_languageserver_1.CompletionItem.create(p.name);
            item.kind = vscode_languageserver_1.CompletionItemKind.Property;
            item.detail = p.type;
            items.push(item);
        });
        return items;
    }
    convertPropertiesToHoverResult(property) {
        let text = property.type + ' ' + property.name;
        let markedString;
        markedString = {
            language: 'csharp',
            value: text
        };
        let hover;
        hover = {
            contents: markedString
        };
        return hover;
    }
    getMatchingFiles(model, namespaces) {
        let modelsPattern = this._rootDir + path.sep + '**' + path.sep + 'Models' + path.sep + '**' + path.sep + '*.cs';
        let viewModelsPattern = this._rootDir + path.sep + '**' + path.sep + 'ViewModels' + path.sep + '**' + path.sep + '*.cs';
        let files = glob.sync(modelsPattern).concat(glob.sync(viewModelsPattern));
        let matchingFiles = [];
        namespaces.forEach(n => {
            files.forEach(f => {
                if (this.isMatchingFile(model, n, f))
                    matchingFiles.push(f);
            });
        });
        return matchingFiles;
    }
    isMatchingFile(model, namespace, file) {
        let text = fs.readFileSync(file, 'utf8');
        let namespaceRegExp = new RegExp('namespace\\s' + namespace);
        let classNameRegExp = new RegExp('class\\s' + model);
        if (namespaceRegExp.test(text) && classNameRegExp.test(text))
            return file;
        return '';
    }
    getAllUsedPropertiesInFile() {
        let items = new Array();
        let propertyRegExp = /.*@Model\.(\w*)/g;
        let lines = this._document.getText().split(/\r?\n/g);
        if (!lines)
            return [];
        lines.forEach((line, i) => {
            let result;
            while ((result = propertyRegExp.exec(line))) {
                let item = new parsingResults_1.PropertyPosition();
                item.property = result[1];
                let start = vscode_languageserver_1.Position.create(i, result.index);
                let end = vscode_languageserver_1.Position.create(i, result.index + result[0].length);
                item.range = vscode_languageserver_1.Range.create(start, end);
                items.push(item);
            }
        });
        return items;
    }
}
exports.default = ModelDeclarationInfo;
//# sourceMappingURL=declarationInfo.js.map