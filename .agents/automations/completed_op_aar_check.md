# Automation: completed_op_aar_check

**Task:** Scan all MilsimOp records with status "Completed". For each one missing an AAR, create a warning flag.

**Trigger:** Scheduled (runs on task trigger)

**Logic:**
1. Fetch all MilsimOp records where status = "Completed"
2. For each op:
   a. Query MilsimAAR records where op_id = this op's id
   b. If no AARs found:
      - Check if a Motd warning already exists for this op
      - If not, create one
   c. If AARs exist, no action needed

**Output:** Sends user a notification with summary.
