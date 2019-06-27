/*

Copyright 2019 Daniel Giljam

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

"use strict"

class OperationSequencer {

    /**
     * @typedef Operation
     * @type {function}
     * @param {...?} opParam
     * @return {string} result
     */

    /**
     * @param {Operation} operation
     * @param {number} sequenceTimeout
     * @param {?} log
     */
    constructor(operation, sequenceTimeout, log) {
        this.operation = operation
        this.sequenceTimeout = sequenceTimeout
        this.log = log
        this.opQueue = []
        this.referenceTimer = new ReferenceTimer({timeoutMonitor: true, sequenceTimeout: this.sequenceTimeout})
        this.execSwitch = false
    }

    /**
     * @param {...?} opParam Must match what the operation -function expects
     */
    sendOp(...opParam) {
        this.log(`An operation instance was received and placed ${this.opQueue.push(...arguments) - (arguments.length - 1)}. in the queue. Timer: ${this.referenceTimer.getTime()}.`)
        this.refreshTimer()
    }

    refreshTimer() {
        try {
            this.sequenceTimer.refresh()
        } catch (error) {
            if (error instanceof TypeError) this.sequenceTimer = setTimeout(this.executeSequence.bind(this), this.sequenceTimeout)
        }
        this.referenceTimer.reset()
    }

    async executeSequence() {
        if (this.execSwitch) {
            this.refreshTimer()
        } else {
            this.execSwitch = true
            const opQueue = this.opQueue.slice(0)
            this.opQueue.length = 0
            await this.operation(opQueue)
            this.execSwitch = false
        }
    }

    get execSwitch() {
        return this.executionSwitch
    }

    set execSwitch(value) {
        this.executionSwitch = !!value
    }
}

class ReferenceTimer {

    constructor() {
        this.startTime = Date.now()
        this.timeoutMonitor = (arguments[0] != null && arguments[0].timeoutMonitor != null) ? arguments[0].timeoutMonitor : false
        if (this.timeoutMonitor) this.sequenceTimeout = (arguments[0] != null && arguments[0].sequenceTimeout != null) ? arguments[0].sequenceTimeout : Infinity
        this.timeoutIdle = true
    }

    getTime() {
        const time = Date.now() - this.startTime
        if (this.timeoutMonitor) {
            if (this.timeoutIdle) return "inactive (never initialized)"
            if (time >= this.sequenceTimeout) return time + "ms (inactive/complete)"
            return time + "ms"
        } else return time
    }

    reset() {
        this.startTime = Date.now()
        this.timeoutIdle = false
    }
}

module.exports = OperationSequencer
