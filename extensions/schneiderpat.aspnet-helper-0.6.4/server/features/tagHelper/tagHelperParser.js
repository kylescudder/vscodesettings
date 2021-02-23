'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const declarationInfo_1 = require("./declarationInfo");
class TagHelperParser {
    static getCompletionItems(position, document, workspaceRoot) {
        let suggestions = new Array();
        let declarationInfo = new declarationInfo_1.default(position, document, workspaceRoot);
        if (declarationInfo.userWantsAspNet()) {
            let aspnetAttr = declarationInfo.getAspNetAttr();
            let aspnetItems = declarationInfo.convertAspNetAttrToCompletionItems(aspnetAttr);
            suggestions = suggestions.concat(aspnetItems);
            return suggestions;
        }
        if (declarationInfo.userWantsAreas()) {
            let areaNames = declarationInfo.getAreaNames();
            let areaItems = declarationInfo.convertAreaNamesToCompletionItems(areaNames);
            suggestions = suggestions.concat(areaItems);
            return suggestions;
        }
        if (declarationInfo.userWantsControllers()) {
            let controllerNames = declarationInfo.getControllerNames();
            let controllerItems = declarationInfo.convertControllerNamesToCompletionItems(controllerNames);
            suggestions = suggestions.concat(controllerItems);
            return suggestions;
        }
        if (declarationInfo.userWantsActions()) {
            let actionResults = declarationInfo.getActionResults();
            let actionItems = declarationInfo.convertActionResultToCompletionItems(actionResults);
            suggestions = suggestions.concat(actionItems);
            return suggestions;
        }
        // if (declarationInfo.userWantsRouteParams()) {
        //     let currentActionResult = declarationInfo.getCurrentActionResult();
        //     if (!currentActionResult.routeParams) return suggestions
        //     let routeItems = declarationInfo.convertRouteParamsToCompletionItems(currentActionResult.routeParams);
        //     suggestions = suggestions.concat(routeItems);
        //     return suggestions;
        // }
        return suggestions;
    }
}
exports.TagHelperParser = TagHelperParser;
//# sourceMappingURL=tagHelperParser.js.map