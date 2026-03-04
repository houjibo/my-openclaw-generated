"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipType = void 0;
/**
 * 意图关系类型
 */
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["PREREQUISITE"] = "prerequisite";
    RelationshipType["NEXT_STEP"] = "next_step";
    RelationshipType["ALTERNATIVE"] = "alternative";
    RelationshipType["RELATED"] = "related";
    RelationshipType["CONFLICT"] = "conflict";
    RelationshipType["REQUIRES"] = "requires"; // 依赖
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
//# sourceMappingURL=types.js.map