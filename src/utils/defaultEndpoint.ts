/**
 * The default shared API endpoint (see README's "Setup & API Configuration")
 * and the limits that apply only to it. A self-hosted endpoint has no
 * inherent limit — these constants exist purely so the client can warn
 * about, and pre-flight check against, the one specific server everyone
 * lands on out of the box.
 */
export const DEFAULT_ENDPOINT = "https://cloud-clipboard-api.onrender.com";

/** Matches the README's documented "Total File Size" limit for the default endpoint. */
export const DEFAULT_ENDPOINT_MAX_UPLOAD_BYTES = 1024 * 1024;
