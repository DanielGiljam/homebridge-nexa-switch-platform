"use strict";

const SEQUENCE_TIMEOUT = 1000;

class OperationSequencer {

    /**
     * @typedef Operation
     * @type {function}
     * @param {...?} opParam
     * @return {string} result
     */

    /**
     * @param {!Operation} operation
     * @param {?} log
     */
    constructor(operation, log) {
        this.operation = operation;
        this.log = log;
        this.opQueue = [];
        this.referenceTimer = new ReferenceTimer({timeoutMonitor: true});
        this.execSwitch = false;
    }

    /**
     * @param {...?} opParam Must match what the operation -function expects
     */
    sendOp(...opParam) {
        if (this.opQueue.length === 0 && this.execSwitch) this.abortSequence();
        this.log(`An operation instance was received and placed ${this.opQueue.push(arguments)}. in the queue. Timer: ${this.referenceTimer.getTime()}.`);
        this.refreshTimer();
    }

    refreshTimer() {
        try {
            this.sequenceTimer.refresh();
        } catch (error) {
            if (error instanceof ReferenceError) this.sequenceTimer = setTimeout(this.executeSequence, SEQUENCE_TIMEOUT);
        }
        this.referenceTimer.reset();
    }

    abortSequence() {
        this.log('Trying to abort operation sequence execution.');
        this.execSwitch = false;
    }

    async executeSequence() {
        const execQueue = this.opQueue;
        this.execSwitch = true;
        const refTimer = new ReferenceTimer();
        const timeDiff = 0;
        for (let opInstance in execQueue) {
            if (this.execSwitch) {
                this.log(await this.operation(...execQueue[opInstance]).then(result => result) + ` Elapsed time in execution: total: ${refTimer.getTime()}ms, diff: ${refTimer.getTime() - timeDiff}.`);
                this.opQueue.splice(opInstance, 1);
            } else {
                this.log(`Operation sequence execution was aborted. Elapsed time in execution: total: ${refTimer.getTime()}ms, diff: ${refTimer.getTime() - timeDiff}.`);
                return;
            }
        }
        this.log(`Completed operation sequence execution. Elapsed time in execution: total: ${refTimer.getTime()}ms, diff: ${refTimer.getTime() - timeDiff}.`);
    }
}

class ReferenceTimer {

    constructor() {
        this.startTime = Date.now();
        this.timeoutMonitor = (arguments[0].timeoutMonitor != null) ? arguments[0].timeoutMonitor : false;
        this.timeoutIdle = true;
    }

    getTime() {
        const time = Date.now() - this.startTime;
        if (this.timeoutMonitor) {
            if (this.timeoutIdle) return 'inactive (never initialized)';
            if (time >= SEQUENCE_TIMEOUT) return 'inactive (complete)';
            return time + 'ms';
        } else return time;
    }
    reset() {
        this.startTime = Date.now();
        this.timeoutIdle = false;
    }
}

module.exports = OperationSequencer;
