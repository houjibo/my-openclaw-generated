#!/bin/bash
# 任务分配系统 - 管理和分配任务

set -e

TASKS_DIR="/tmp/lobster-tasks"
mkdir -p "$TASKS_DIR"

# 创建任务
create_task() {
    local title="$1"
    local type="$2"
    local priority="${3:-normal}"
    local assigned_to="${4:-unassigned}"
    local description="$5"

    local task_id=$(uuidgen | tr '[:upper:]' '[:lower:]' | cut -d'-' -f1)
    local task_file="$TASKS_DIR/$task_id.json"

    cat > "$task_file" << EOF
{
  "id": "$task_id",
  "title": "$title",
  "type": "$type",
  "priority": "$priority",
  "assigned_to": "$assigned_to",
  "description": "$description",
  "status": "pending",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

    echo "✅ 任务已创建: $task_id"
    echo "   标题: $title"
    echo "   类型: $type"
    echo "   优先级: $priority"
}

# 分配任务
assign_task() {
    local task_id="$1"
    local assignee="$2"

    local task_file="$TASKS_DIR/$task_id.json"

    if [ ! -f "$task_file" ]; then
        echo "❌ 任务不存在: $task_id"
        exit 1
    fi

    # 更新任务
    jq --arg assignee "$assignee" \
       --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.assigned_to = $assignee | .updated_at = $updated | .status = "assigned"' \
       "$task_file" > "${task_file}.tmp"
    mv "${task_file}.tmp" "$task_file"

    echo "✅ 任务已分配: $task_id -> $assignee"
}

# 更新任务状态
update_status() {
    local task_id="$1"
    local status="$2"  # pending, assigned, in_progress, completed, failed

    local task_file="$TASKS_DIR/$task_id.json"

    if [ ! -f "$task_file" ]; then
        echo "❌ 任务不存在: $task_id"
        exit 1
    fi

    # 更新状态
    jq --arg status "$status" \
       --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.status = $status | .updated_at = $updated' \
       "$task_file" > "${task_file}.tmp"
    mv "${task_file}.tmp" "$task_file"

    echo "✅ 任务状态已更新: $task_id -> $status"
}

# 列出任务
list_tasks() {
    local filter="$1"  # all, pending, assigned, in_progress, completed

    echo "📋 任务列表"
    echo "===================="

    for task_file in $(ls -t "$TASKS_DIR"/*.json 2>/dev/null); do
        if [ -f "$task_file" ]; then
            local status=$(jq -r '.status' "$task_file")

            if [ "$filter" = "all" ] || [ "$filter" = "$status" ]; then
                echo ""
                echo "ID: $(jq -r '.id' "$task_file")"
                echo "标题: $(jq -r '.title' "$task_file")"
                echo "类型: $(jq -r '.type' "$task_file")"
                echo "优先级: $(jq -r '.priority' "$task_file")"
                echo "分配给: $(jq -r '.assigned_to' "$task_file")"
                echo "状态: $status"
                echo "创建时间: $(jq -r '.created_at' "$task_file")"
            fi
        fi
    done

    echo "===================="
}

# 删除任务
delete_task() {
    local task_id="$1"
    local task_file="$TASKS_DIR/$task_id.json"

    if [ ! -f "$task_file" ]; then
        echo "❌ 任务不存在: $task_id"
        exit 1
    fi

    rm "$task_file"
    echo "✅ 任务已删除: $task_id"
}

# 主逻辑
case "$1" in
    create)
        create_task "$2" "$3" "${4:-normal}" "${5:-unassigned}" "$6"
        ;;
    assign)
        assign_task "$2" "$3"
        ;;
    update)
        update_status "$2" "$3"
        ;;
    list)
        list_tasks "${2:-all}"
        ;;
    delete)
        delete_task "$2"
        ;;
    *)
        echo "用法: $0 {create|assign|update|list|delete}"
        echo ""
        echo "命令:"
        echo "  create <title> <type> [priority] [assignee] [description]  - 创建任务"
        echo "  assign <task_id> <assignee>                             - 分配任务"
        echo "  update <task_id> <status>                               - 更新状态"
        echo "  list [filter]                                             - 列出任务"
        echo "  delete <task_id>                                          - 删除任务"
        echo ""
        echo "状态: pending, assigned, in_progress, completed, failed"
        echo "优先级: low, normal, high, critical"
        exit 1
        ;;
esac
