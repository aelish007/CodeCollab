const ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",
  CODE_CHANGE: "code-change",
  LANGUAGE_CHANGE: "language-change",
  SYNC_CHANGES: "sync-changes",
  MESSAGE: "message",
  CANVAS_CHANGE: "canvas-change",
  COMPILE_CODE: "compile_code",
  CODE_COMPILE_RESULT: "code_compile_result",
  REVIEW_CODE: "review-code",
  CODE_REVIEW_RESULT: "code-review-result",
  // Admin actions
  JOIN_REQUEST: "join-request",
  JOIN_REQUEST_ACCEPTED: "join-request-accepted",
  JOIN_REQUEST_REJECTED: "join-request-rejected",
  REMOVE_PARTICIPANT: "remove-participant",
  PARTICIPANT_REMOVED: "participant-removed",
  CHECK_ADMIN_STATUS: "check-admin-status",
  ADMIN_STATUS: "admin-status",
  GET_PENDING_REQUESTS: "get-pending-requests",
  PENDING_REQUESTS_UPDATE: "pending-requests-update",
  GET_PARTICIPANTS: "get-participants",
  PARTICIPANTS_UPDATE: "participants-update",
  PASSWORD_ERROR: "password-error"
};

export default ACTIONS;
