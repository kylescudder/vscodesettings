'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class ActionResult {
    constructor(actionResult) {
        this._asyncActionsRegExp = /\[HttpGet\]\r\n\s*public\sasync\sTask<([a-zA-Z]*<?[a-zA-Z]+>?)>\s([a-zA-Z]+)\((.*)\)/;
        this._syncActionsRegExp = /\[HttpGet\]\r\n\s*public\s([a-zA-Z]*<?[a-zA-Z]+>?)\s([a-zA-Z]+)\((.*)\)/;
        if (actionResult) {
            if (this._asyncActionsRegExp.test(actionResult))
                this.parseActionResult(actionResult, TagHelperRegExp.Async);
            if (this._syncActionsRegExp.test(actionResult))
                this.parseActionResult(actionResult, TagHelperRegExp.Sync);
        }
    }
    parseActionResult(actionResult, type) {
        let parts = null;
        if (type === TagHelperRegExp.Async)
            parts = GetParts(actionResult, this._asyncActionsRegExp);
        if (type === TagHelperRegExp.Sync)
            parts = GetParts(actionResult, this._syncActionsRegExp);
        if (!parts)
            return;
        this.type = parts[1];
        this.name = parts[2];
        if (parts[3])
            this.parseRouteParams(parts[3]);
    }
    parseRouteParams(routeParams) {
        if (!this.routeParams)
            this.routeParams = new Array();
        routeParams.split(', ').forEach(p => {
            let param = p.split(' ');
            let item = new Property();
            item.type = param[0];
            item.name = param[1];
            this.routeParams.push(item);
        });
    }
}
exports.ActionResult = ActionResult;
var TagHelperRegExp;
(function (TagHelperRegExp) {
    TagHelperRegExp[TagHelperRegExp["Async"] = 0] = "Async";
    TagHelperRegExp[TagHelperRegExp["Sync"] = 1] = "Sync";
})(TagHelperRegExp = exports.TagHelperRegExp || (exports.TagHelperRegExp = {}));
class Property {
}
exports.Property = Property;
class PropertyPosition {
}
exports.PropertyPosition = PropertyPosition;
function GetParts(text, regExp) {
    if (!regExp.test(text))
        return null;
    return regExp.exec(text);
}
exports.GetParts = GetParts;
//# sourceMappingURL=parsingResults.js.map