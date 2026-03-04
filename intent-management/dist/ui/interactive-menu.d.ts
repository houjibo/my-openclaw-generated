import { Intent } from '../models/intent';
/**
 * 交互式菜单
 */
export declare class InteractiveMenu {
    /**
     * 展示菜单并获取用户选择
     */
    showMenu(options: Array<{
        intent: Intent;
        confidence: number;
    }>): Promise<Intent | null>;
    /**
     * 展示意图详情
     */
    showIntentDetails(intent: Intent): void;
    /**
     * 展示执行结果
     */
    showExecutionResult(result: any): void;
    /**
     * 获取置信度颜色
     */
    private getConfidenceColor;
    /**
     * 获取置信度条
     */
    private getConfidenceBar;
    /**
     * 获取意图图标
     */
    private getIntentIcon;
}
//# sourceMappingURL=interactive-menu.d.ts.map