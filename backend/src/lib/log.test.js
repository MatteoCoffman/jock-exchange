import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { logError, sendRouteError, shouldLogError } from "./log.js";

describe("shouldLogError", () => {
  it("skips expected client failures", () => {
    assert.equal(shouldLogError({ status: 400 }, undefined), false);
    assert.equal(shouldLogError({ status: 401 }, undefined), false);
    assert.equal(shouldLogError({ status: 404 }, undefined), false);
    assert.equal(shouldLogError(new Error("nope"), 403), false);
  });

  it("logs server and unknown failures", () => {
    assert.equal(shouldLogError(new Error("boom"), undefined), true);
    assert.equal(shouldLogError({ status: 500 }, undefined), true);
    assert.equal(shouldLogError({ status: 502 }, undefined), true);
    assert.equal(shouldLogError(new Error("upstream"), 502), true);
  });
});

describe("logError", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("prints unexpected errors with context", () => {
    const error = mock.method(console, "error", () => {});
    logError("trades.post", new Error("db down"));
    assert.equal(error.mock.callCount(), 1);
    assert.equal(error.mock.calls[0].arguments[0], "[trades.post]");
  });

  it("stays quiet for 4xx", () => {
    const error = mock.method(console, "error", () => {});
    const err = new Error("bad password");
    err.status = 401;
    logError("auth.login", err);
    assert.equal(error.mock.callCount(), 0);
  });
});

describe("sendRouteError", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("responds with status and logs only server errors", () => {
    const error = mock.method(console, "error", () => {});
    const statuses = [];
    const bodies = [];
    const res = {
      status(code) {
        statuses.push(code);
        return this;
      },
      json(body) {
        bodies.push(body);
      },
    };

    const clientErr = new Error("Insufficient cash");
    clientErr.status = 400;
    sendRouteError(res, clientErr, "trades.post");
    assert.deepEqual(statuses, [400]);
    assert.deepEqual(bodies, [{ error: "Insufficient cash" }]);
    assert.equal(error.mock.callCount(), 0);

    sendRouteError(res, new Error("pool boom"), "portfolio.get");
    assert.deepEqual(statuses, [400, 500]);
    assert.deepEqual(bodies[1], { error: "pool boom" });
    assert.equal(error.mock.callCount(), 1);
  });
});
