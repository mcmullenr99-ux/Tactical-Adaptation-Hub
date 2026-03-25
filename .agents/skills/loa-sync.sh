#!/bin/bash
# Triggered by: loa_calendar_sync automation
# Purpose: Check and update all LOA statuses daily

curl -s -X POST "https://agent-tag-lead-developer-cff87ae4.base44.app/functions/loaCalendarSync" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

echo "LOA calendar sync completed"
