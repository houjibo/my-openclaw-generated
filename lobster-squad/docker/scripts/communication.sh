#!/bin/bash
# 协作通信脚本 - 特工间消息传递

set -e

MESSAGE_DIR="/tmp/lobster-messages"
mkdir -p "$MESSAGE_DIR"

# 发送消息
send_message() {
    local from="$1"
    local to="$2"
    local message="$3"
    local priority="${4:-normal}"

    local message_file="$MESSAGE_DIR/$to.$(date +%s).msg"

    cat > "$message_file" << EOF
{
  "from": "$from",
  "to": "$to",
  "message": "$message",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "priority": "$priority"
}
EOF

    echo "✅ 消息已发送: $from -> $to"
}

# 接收消息
receive_messages() {
    local to="$1"

    echo "📨 来自 $to 的消息:"
    echo "===================="

    for msg_file in $(ls -t "$MESSAGE_DIR"/$to.*.msg 2>/dev/null | head -10); do
        if [ -f "$msg_file" ]; then
            echo ""
            cat "$msg_file" | jq -r '"[\(.timestamp)] \(.from): \(.message"'
            rm "$msg_file"
        fi
    done

    echo ""
    echo "===================="
}

# 广播消息
broadcast() {
    local from="$1"
    local message="$2"
    local priority="${3:-normal}"

    for container in $(docker ps --filter "name=lobster-" --format "{{.Names}}"); do
        local to="${container#lobster-}"
        send_message "$from" "$to" "$message" "$priority"
    done
}

# 列出消息
list_messages() {
    local to="${1:-*}"

    echo "📨 消息列表:"
    echo "===================="

    for msg_file in $(ls -t "$MESSAGE_DIR"/$to.*.msg 2>/dev/null); do
        if [ -f "$msg_file" ]; then
            echo ""
            cat "$msg_file" | jq '.'
        fi
    done

    echo "===================="
}

# 清空消息
clear_messages() {
    rm -f "$MESSAGE_DIR"/*.msg
    echo "✅ 所有消息已清空"
}

# 主逻辑
case "$1" in
    send)
        send_message "$2" "$3" "$4" "${5:-normal}"
        ;;
    receive)
        receive_messages "$2"
        ;;
    broadcast)
        broadcast "$2" "$3" "${4:-normal}"
        ;;
    list)
        list_messages "$2"
        ;;
    clear)
        clear_messages
        ;;
    *)
        echo "用法: $0 {send|receive|broadcast|list|clear}"
        echo ""
        echo "命令:"
        echo "  send <from> <to> <message> [priority]  - 发送消息"
        echo "  receive <to>                              - 接收消息"
        echo "  broadcast <from> <message> [priority]     - 广播消息"
        echo "  list [to]                                 - 列出消息"
        echo "  clear                                      - 清空消息"
        exit 1
        ;;
esac
