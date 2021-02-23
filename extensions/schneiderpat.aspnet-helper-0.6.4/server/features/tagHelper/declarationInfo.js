"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const parsingResults_1 = require("../parsingResults");
class TagHelperDeclarationInfo {
    constructor(position, document, workspaceRoot) {
        // ----------------------------------------------------------------------------------
        this._asyncActionsRegExp = /\[HttpGet\]\r\n\s*public\sasync\sTask<(\w*<?\w+>?)>\s(\w+)\((.*)\)/g;
        this._syncActionsRegExp = /\[HttpGet\]\r\n\s*public\s(\w*<?\w+>?)\s(\w+)\((.*)\)/g;
        // Get specfic part of a text
        this.currentAreaRegExp = /.*asp-area="(\w+)".?/;
        this.currentControllerRegExp = /.*asp-controller="(\w+)".?/;
        this.currentActionRegExp = /.*asp-action="(\w+)".?/;
        this.controllerNameRegExp = /(\w+)Controller\.cs/;
        this.actionNameRegExp = /.?\s(\w+)\(.*\)/;
        this._document = document;
        this._position = position;
        this.getRootPath();
        this.setInput();
    }
    setInput() {
        let lines = this._document.getText().split(/\r?\n/g);
        this._input = lines[this._position.line].substr(0, this._position.character);
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
    // ----------------------------------------------------------------------------------
    userWantsAspNet() {
        let aspnetTest = /.*<a.*asp-$/;
        if (aspnetTest.test(this._input))
            return true;
        return false;
    }
    getAspNetAttr() {
        let items = [
            "asp-area",
            "asp-controller"
        ];
        return items;
    }
    convertAspNetAttrToCompletionItems(attr) {
        let items = new Array();
        attr.forEach(a => {
            let item = vscode_languageserver_1.CompletionItem.create(a);
            item.insertText = a.split('-')[1] + '=""';
            item.kind = vscode_languageserver_1.CompletionItemKind.Property;
            items.push(item);
        });
        return items;
    }
    // ----------------------------------------------------------------------------------
    userWantsAreas() {
        let areaTest = /.*asp-area="\w*$/;
        if (areaTest.test(this._input))
            return true;
        return false;
    }
    getAreaNames() {
        let areaNames = [];
        let directories = this.getAreaDirectories();
        if (!directories)
            return areaNames;
        directories.forEach((d) => { areaNames.push(d); });
        return areaNames;
    }
    convertAreaNamesToCompletionItems(areas) {
        let items = new Array();
        areas.forEach(a => {
            let item = vscode_languageserver_1.CompletionItem.create(a);
            items.push(item);
        });
        return items;
    }
    getAreaDirectories() {
        let areaDir = this._rootDir + path.sep + 'Areas' + path.sep;
        if (!fs.existsSync(areaDir))
            return [];
        let directories = fs.readdirSync(areaDir).filter((file) => {
            return fs.statSync(path.join(areaDir, file)).isDirectory();
        });
        return directories;
    }
    // ----------------------------------------------------------------------------------
    userWantsControllers() {
        let controllerTest = /.*asp-controller="\w*$/;
        if (controllerTest.test(this._input))
            return true;
        return false;
    }
    getControllerNames() {
        let area = this.getSpecificPart(this._input, this.currentAreaRegExp);
        let files = this.getControllerFiles(area);
        let controllerNames = [];
        files.forEach((f) => {
            let controllerName = this.getSpecificPart(f, this.controllerNameRegExp);
            controllerNames.push(controllerName);
        });
        return controllerNames;
    }
    convertControllerNamesToCompletionItems(controllers) {
        let items = new Array();
        controllers.forEach(c => {
            let item = vscode_languageserver_1.CompletionItem.create(c);
            item.kind = vscode_languageserver_1.CompletionItemKind.Class;
            items.push(item);
        });
        return items;
    }
    getControllerFiles(area) {
        let pattern = this._rootDir + path.sep;
        if (area) {
            pattern += 'Areas' + path.sep + area + path.sep + "Controllers" + path.sep + '*Controller.cs';
        }
        else {
            pattern += "Controllers" + path.sep + '*Controller.cs';
        }
        let files = glob.sync(pattern);
        if (files)
            return files;
        return [];
    }
    userWantsActions() {
        let actionTest = /.*asp-action="\w*$/;
        if (actionTest.test(this._input))
            return true;
        return false;
    }
    getActionResults() {
        let actionResults = new Array();
        let actionMethods = this.getActionMethods();
        actionMethods.forEach(a => {
            let item = new parsingResults_1.ActionResult(a);
            actionResults.push(item);
        });
        return actionResults;
    }
    getControllerPath() {
        let pattern = this._rootDir + path.sep;
        let area = parsingResults_1.GetParts(this._input, this.currentAreaRegExp);
        let controller = parsingResults_1.GetParts(this._input, this.currentControllerRegExp);
        let controllerName = '';
        if (controller)
            controllerName = controller[1];
        if (!controller)
            controllerName = this.getCurrentController();
        // TODO: Add action only routing
        if (!area && !controllerName)
            return '';
        if (area) {
            return pattern + 'Areas' + path.sep + area[1] + path.sep + 'Controllers' + path.sep + controllerName + 'Controller.cs';
        }
        else {
            return pattern + 'Controllers' + path.sep + controllerName + 'Controller.cs';
        }
    }
    getActionMethods() {
        let pattern = this.getControllerPath();
        if (!pattern)
            return [];
        if (!fs.existsSync(pattern))
            return [];
        let file = fs.readFileSync(pattern, 'utf8');
        let actions = [];
        let asyncActions = file.match(this._asyncActionsRegExp);
        if (asyncActions)
            asyncActions.forEach((a) => { actions.push(a); });
        let syncActions = file.match(this._syncActionsRegExp);
        if (syncActions)
            syncActions.forEach((a) => { actions.push(a); });
        return actions;
    }
    convertActionResultToCompletionItems(actionResults) {
        let items = new Array();
        actionResults.forEach(a => {
            let item = vscode_languageserver_1.CompletionItem.create(a.name);
            item.kind = vscode_languageserver_1.CompletionItemKind.Method;
            item.detail = a.type;
            if (a.routeParams) {
                item.documentation = 'Found route parameter:\n';
                let position = vscode_languageserver_1.Position.create(this._position.line, this._position.character + 1);
                let newText = ' ';
                a.routeParams.forEach((r) => {
                    item.documentation += r.type + ' ' + r.name + '\n';
                    newText += 'asp-route-' + r.name + '="" ';
                });
                item.additionalTextEdits = new Array();
                let textEdit = vscode_languageserver_1.TextEdit.insert(position, newText);
                item.additionalTextEdits.push(textEdit);
            }
            items.push(item);
        });
        return items;
    }
    getCurrentController() {
        let folderNameRegExp = new RegExp('.*\\' + path.sep + '(\w+)$');
        let documentPath = vscode_languageserver_1.Files.uriToFilePath(this._document.uri);
        if (!documentPath)
            return '';
        let name = folderNameRegExp.exec(path.dirname(documentPath));
        if (name)
            return name[1];
        return '';
    }
    // ----------------------------------------------------------------------------------
    userWantsRouteParams() {
        let routeParamsTest = /.*asp-route-\w*$/;
        if (routeParamsTest.test(this._input))
            return true;
        return false;
    }
    getCurrentActionResult() {
        let action = this.getCurrentAction();
        if (!action)
            return new parsingResults_1.ActionResult();
        let actionResults = this.getActionResults().filter(a => { return (a.name === action); });
        if (!actionResults)
            return new parsingResults_1.ActionResult();
        if (actionResults.length > 1)
            return new parsingResults_1.ActionResult();
        return actionResults[0];
    }
    // public convertRouteParamsToCompletionItems(routeParams: Property[]): CompletionItem[] {
    //     let items = new Array<CompletionItem>();
    //     routeParams.forEach(r => {
    //         let item: CompletionItem = {
    //             label: 'asp-route-' + r.name,
    //             insertText: this.createRouteSnippet(r.name),
    //             kind: CompletionItemKind.Variable,
    //             detail: r.type
    //         }
    //         items.push(item);
    //     });
    //     return items;
    // }
    getCurrentAction() {
        let actionTest = /asp-action="(\w+)"/;
        let action = parsingResults_1.GetParts(this._input, actionTest);
        if (!action)
            return '';
        return action[1];
    }
    getSpecificPart(text, regExp, part = 1) {
        if (!regExp.test(text))
            return '';
        let result = regExp.exec(text);
        if (!result)
            return '';
        return result[part];
    }
}
exports.default = TagHelperDeclarationInfo;
//# sourceMappingURL=declarationInfo.js.map